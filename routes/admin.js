const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

router.use(auth, role('admin'));

// KPI
router.get('/kpi', async (req, res) => {
  const totalDoctors = await User.countDocuments({ role: 'doctor' });
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const todayAppointments = await Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } });
  const revenue = 18420; // mock – you can sum payments later
  res.json({ totalDoctors, totalPatients, todayAppointments, revenue });
});

// Doctors list
router.get('/doctors', async (req, res) => {
  const doctors = await User.find({ role: 'doctor' }).select('-password');
  res.json(doctors);
});

// Add a new doctor
router.post('/doctors', async (req, res) => {
  try {
    const { firstName, lastName, email, password, specialization, licenseNumber } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const doctor = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'doctor',
      specialization: specialization || '',
      licenseNumber: licenseNumber || '',
      dateOfBirth: new Date('1970-01-01'),
      phone: ''
    });

    await doctor.save();
    res.status(201).json({
      message: 'Doctor created',
      doctor: { id: doctor._id, firstName, lastName, email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Patients list
router.get('/patients', async (req, res) => {
  const patients = await User.find({ role: 'patient' }).select('-password');
  res.json(patients);
});

// All appointments
router.get('/appointments', async (req, res) => {
  const appointments = await Appointment.find().populate('user doctor', 'firstName lastName email').sort({ date: -1 });
  res.json(appointments);
});

// Verify doctor
router.put('/doctors/:id/verify', async (req, res) => {
  const { verified } = req.body;
  await User.findByIdAndUpdate(req.params.id, { isVerified: verified });
  res.json({ message: `Doctor ${verified ? 'verified' : 'unverified'}` });
});

// Delete doctor
router.delete('/doctors/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'Doctor removed' });
});

module.exports = router;
