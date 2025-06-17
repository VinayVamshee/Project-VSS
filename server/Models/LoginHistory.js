// models/LoginHistory.js
const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userType: { type: String, enum: ['user', 'admin'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'userType' },
  username: { type: String },
  loginTime: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
