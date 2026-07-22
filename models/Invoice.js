const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  invoiceNumber: { type: String, unique: true, required: true },
  amount: { type: Number, required: true }, // in dollars
  currency: { type: String, default: 'usd' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  description: String,
  paymentMethod: String, // e.g., 'stripe'
  paymentIntentId: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date
});

module.exports = mongoose.model('Invoice', invoiceSchema);