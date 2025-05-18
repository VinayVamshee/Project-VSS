const mongoose = require('mongoose');

const subFieldSchema = new mongoose.Schema({
    label: { type: String, required: true }
});

const inputFieldSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: { type: String, enum: ['group', 'field', 'option'], required: true },
    fields: [subFieldSchema]
});

const FormSchema = new mongoose.Schema({
    SNo: { type: Number },
    inputFields: [inputFieldSchema],
    showIn: {
        type: [String],
        default: []
    }

});

module.exports = mongoose.model('Form', FormSchema);
