const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  location: { type: String, required: true },
  rating: { type: Number, min: 0, max: 5, default: 4.5 },
  reviews: { type: Number, default: 0 },
  nextAvailable: { type: String, default: 'Check availability' },
  avatarInitials: { type: String },
  consultationFee: { type: Number, default: 50 },
  onlineFee: { type: Number, default: 40 }
});

module.exports = mongoose.model('Doctor', doctorSchema);