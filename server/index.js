require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const FormSchema = require('./Models/Form');
const Case = require('./Models/Case');

const uri = process.env.MONGODB_URL;

const connectDB = () => {
    console.log("DataBase Connected");
    return mongoose.connect(uri);
};

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Save form template
app.post('/add-form', async (req, res) => {
    try {
        const { SNo, inputFields } = req.body;
        const form = new FormSchema({ SNo, inputFields });
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

app.get('/get-cases', async (req, res) => {
    try {
        const cases = await Case.find().sort({ SNo: 1 }); 
        res.status(200).json(cases);
    } catch (error) {
        console.error('Error fetching cases:', error);
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
            { new: true } // Return the updated document
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
