const mongoose = require('mongoose');
const prescriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String, required: true },
  medication: { type: String, required: true },
  dosage: { type: String },
  instructions: { type: String },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Prescription', prescriptionSchema);