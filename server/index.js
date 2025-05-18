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

app.put('/transfer-dar-action/:id', async (req, res) => {
  const caseId = req.params.id;

  try {
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      {
        checkClose: true
      },
      { new: true }
    );
    res.json(updatedCase);
  } catch (err) {
    console.error('Transfer error:', err);
    res.status(500).json({ message: 'Error transferring case to DAR Action' });
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
