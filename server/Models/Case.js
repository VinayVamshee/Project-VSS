const mongoose = require('mongoose');
const { Schema } = mongoose;

const CaseSchema = new Schema({
    SNo: {
        type: Number,
        required: true,
    },
    inputFields: {
        type: Object,
        required: true
    },
    checkClose: {
        type: Boolean,
        default: false
    },
    checkClosedAt: {
        type: Date,
        default: null
    },
    Closed: {
        type: Boolean,
        default: false
    },
    closedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

CaseSchema.pre('save', function (next) {
    if (this.isModified('Closed') && this.Closed === true && !this.closedAt) {
        this.closedAt = new Date();
    }
    if(this.isModified('checkClose') && this.checkClose === true && !this.checkClosedAt) {
        this.checkClosedAt = new Date();
    }
    next();
});

const Case = mongoose.model('Case', CaseSchema);

module.exports = Case;
