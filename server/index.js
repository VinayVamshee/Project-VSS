require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');


const FormSchema = require('./Models/Form');
const Case = require('./Models/Case');
const connectDB = require('./connectDB');
const User = require('./Models/User');
const Admin = require('./Models/Admin');
const LoginHistory = require('./Models/LoginHistory')


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;
const secret = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, secret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Save form template
app.post('/add-form', async (req, res) => {
    try {
        const { SNo, inputFields, showIn } = req.body;
        const form = new FormSchema({ SNo, inputFields, showIn });
        await form.save();
        res.status(201).json({ message: 'Form saved successfully', form });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save form', details: err.message });
    }
});

// Get form templates
app.get('/get-forms', async (req, res) => {
    try {
        const forms = await FormSchema.find().sort({ SNo: 1 });
        res.status(200).json(forms);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch forms', details: err.message });
    }
});

// Save filled form case
app.post('/post-case', async (req, res) => {
    try {
        const { SNo, inputFields } = req.body;

        const newCase = new Case({
            SNo,
            inputFields
        });

        await newCase.save();
        res.status(201).json({ message: 'Case saved successfully.' });
    } catch (error) {
        console.error('Error saving case:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

app.get('/get-cases', authenticateToken, async (req, res) => {
    try {
        let cases = await Case.find().sort({ SNo: 1 });

        if (req.user.role !== 'admin' && req.user.role !== 'DAR Action') {
            cases = cases.filter(c =>
                c.inputFields &&
                c.inputFields["Name Of Concern VI"] === req.user.username
            );
        }

        res.status(200).json(cases);
    } catch (error) {
        res.status(500).json({ error: 'Server error.' });
    }
});


app.put('/update-case/:id', async (req, res) => {
    try {
        const caseId = req.params.id;
        const { inputFields, Closed } = req.body;

        const updatedCase = await Case.findByIdAndUpdate(
            caseId,
            { inputFields, Closed },
            { new: true }
        );

        res.status(200).json({ message: "Case updated successfully", updatedCase });
    } catch (error) {
        console.error('Error updating case:', error);
        res.status(500).json({ error: "Failed to update case" });
    }
});

app.put('/close-case/:id', async (req, res) => {
    const caseId = req.params.id;

    try {
        const closedCase = await Case.findByIdAndUpdate(
            caseId,
            { Closed: true },
            { new: true }
        );
        res.json(closedCase);
    } catch (err) {
        res.status(500).json({ message: 'Error closing case' });
    }
});

app.put('/transfer-stage/:id', async (req, res) => {
    const caseId = req.params.id;
    const { checkClose } = req.body;

    try {
        const updatedCase = await Case.findByIdAndUpdate(
            caseId,
            { checkClose },
            { new: true }
        );
        res.json(updatedCase);
    } catch (err) {
        console.error('Transfer error:', err);
        res.status(500).json({ message: 'Error updating case status' });
    }
});



app.put('/reopen-case/:caseId', async (req, res) => {
    const { caseId } = req.params;

    try {
        // Find the case by ID and update the 'Closed' field to false
        const updatedCase = await Case.findByIdAndUpdate(
            caseId,
            { Closed: false },
            { new: true } // Return the updated document
        );

        if (!updatedCase) {
            return res.status(404).json({ message: 'Case not found' });
        }

        res.status(200).json({ message: 'Case reopened successfully', case: updatedCase });
    } catch (err) {
        console.error('Error reopening case:', err);
        res.status(500).json({ message: 'Error reopening case' });
    }
});

// Update a specific input field inside a form document
app.post('/update-field', async (req, res) => {
    try {
        const { formId, fieldIndex, updatedField } = req.body;

        if (!formId || fieldIndex === undefined || !updatedField) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const form = await FormSchema.findById(formId);
        if (!form) {
            return res.status(404).json({ error: 'Form not found' });
        }

        if (fieldIndex < 0 || fieldIndex >= form.inputFields.length) {
            return res.status(400).json({ error: 'Invalid field index' });
        }

        // Update allowed inputField fields only
        form.inputFields[fieldIndex] = {
            ...form.inputFields[fieldIndex]._doc,
            label: updatedField.label,
            type: updatedField.type,
            fields: updatedField.type === 'field' ? undefined : (updatedField.fields || [])
        };

        // Update SNo and showIn at form level if provided
        if (updatedField.SNo !== undefined) {
            form.SNo = updatedField.SNo;
        }
        if (updatedField.showIn !== undefined) {
            form.showIn = updatedField.showIn;
        }

        await form.save();

        res.status(200).json({ message: 'Field updated successfully', form });
    } catch (err) {
        console.error('Error updating field:', err);
        res.status(500).json({ error: 'Server error updating field' });
    }
});


app.delete('/form/:formId/field/:fieldIndex', async (req, res) => {
    const { formId, fieldIndex } = req.params;
    const index = parseInt(fieldIndex, 10);

    try {
        const form = await FormSchema.findById(formId);
        if (!form) {
            return res.status(404).json({ message: 'Form not found' });
        }

        if (!form.inputFields || index < 0 || index >= form.inputFields.length) {
            return res.status(400).json({ message: 'Invalid field index' });
        }

        // Remove the field at index
        form.inputFields.splice(index, 1);

        // Save the updated form
        await form.save();

        res.status(200).json({ message: 'Field deleted successfully', form });
    } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/user', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.put('/user/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.send(user);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.delete('/user/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.send({ message: 'User deleted' });
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/user', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        res.status(500).send({ error: 'Failed to fetch users' });
    }
});

// --- Admin Routes --- //
app.post('/admin', async (req, res) => {
    try {
        const admin = new Admin(req.body);
        await admin.save();
        res.status(201).send(admin);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.put('/admin/:id', async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.send(admin);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.delete('/admin/:id', async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.send({ message: 'Admin deleted' });
    } catch (err) {
        res.status(400).send(err);
    }
});


// --- User Login --- //
app.post('/user/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });

    if (!user) return res.status(401).send({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, username }, secret);

    // Save login history
    await LoginHistory.create({
        userType: 'user',
        userId: user._id,
        username: user.username,
        loginTime: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.ip,
        userAgent: req.headers['user-agent']
    });

    res.send({ token, role: user.role });
});

// --- Admin Login --- //
app.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });

    if (!admin) return res.status(401).send({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, secret);

    // Save login history
    await LoginHistory.create({
        userType: 'admin',
        userId: admin._id,
        username: admin.username,
        loginTime: new Date(),
        ipAddress: req.headers['x-forwarded-for'] || req.ip,
        userAgent: req.headers['user-agent']
    });

    res.send({ token, admin });
});

app.get('/admin/login-history', async (req, res) => {
    const history = await LoginHistory.find().sort({ loginTime: -1 });
    res.send(history);
});

















const start = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log('Server Connected');
        });
    } catch (error) {
        console.log(error);
    }
};

start();

module.exports = app;
