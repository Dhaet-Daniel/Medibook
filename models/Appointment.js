const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName: { type: String, required: true }, // denormalised for easier display
  date: { type: Date, required: true },
  time: { type: String, required: true },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);