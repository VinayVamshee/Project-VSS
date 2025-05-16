const mongoose = require('mongoose');

const subFieldSchema = new mongoose.Schema({
    label: { type: String, required: true }
});

const inputFieldSchema = new mongoose.Schema({
    label: { type: String, required: true },       // e.g., "Personal Information"
    type: { type: String, enum: ['group', 'field', 'option'], required: true },
    fields: [subFieldSchema]                        // only for 'group' type
});

const FormSchema = new mongoose.Schema({
    SNo: { type: Number },
    inputFields: [inputFieldSchema]
});

module.exports = mongoose.model('Form', FormSchema);
