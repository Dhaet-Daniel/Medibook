const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/prescriptions', auth, async (req, res) => {
  const prescriptions = await Prescription.find({ user: req.userId }).sort({ date: -1 });
  res.json(prescriptions);
});

router.get('/patient/medical-summary', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('bloodType allergies conditions diagnoses');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/patient/medical-summary', auth, async (req, res) => {
  try {
    const { bloodType, allergies, conditions, diagnoses } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.bloodType = bloodType ?? user.bloodType;
    user.allergies = allergies ?? user.allergies;
    user.conditions = conditions ?? user.conditions;
    user.diagnoses = diagnoses ?? user.diagnoses;
    await user.save();

    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/billing/invoices', auth, async (req, res) => {
  const mockInvoices = [
    { invoiceNumber: 'INV-001', date: new Date(), amount: 150, status: 'paid', description: 'Consultation' },
    { invoiceNumber: 'INV-002', date: new Date(), amount: 250, status: 'pending', description: 'Lab tests' }
  ];
  res.json(mockInvoices);
});

module.exports = router;