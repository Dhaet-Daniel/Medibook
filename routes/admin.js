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
  const revenue = 18420; // mock
  res.json({ totalDoctors, totalPatients, todayAppointments, revenue });
});

// Doctors list
router.get('/doctors', async (req, res) => {
  const doctors = await User.find({ role: 'doctor' }).select('-password');
  res.json(doctors);
});

// Add a new doctor - creates User + Doctor
router.post('/doctors', async (req, res) => {
  try {
    const { firstName, lastName, email, password, specialization, licenseNumber, location } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const user = new User({
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

    await user.save();

    const doctor = new Doctor({
      name: `${firstName} ${lastName}`,
      specialty: specialization || 'General Practice',
      location: location || 'Main Hospital',
      rating: 4.5,
      reviews: 0,
      nextAvailable: 'Check availability',
      avatarInitials: (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
    });

    await doctor.save();
    res.status(201).json({
      message: 'Doctor created',
      doctor: { id: doctor._id, name: doctor.name, specialty: doctor.specialty }
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

// Get single doctor (for edit modal)
router.get('/doctors/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Doctor not found' });
    // Also get location from Doctor document
    const doctor = await Doctor.findOne({ name: { $regex: new RegExp(`^${user.firstName} ${user.lastName}$`, 'i') } });
    res.json({
      ...user.toObject(),
      location: doctor?.location || ''
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update doctor (PUT)
router.put('/doctors/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, specialization, licenseNumber, location } = req.body;
    // Update User
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Doctor not found' });
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.specialization = specialization || user.specialization;
    user.licenseNumber = licenseNumber || user.licenseNumber;
    await user.save();

    // Update Doctor document (for patient view)
    const doctor = await Doctor.findOne({ name: { $regex: new RegExp(`^${user.firstName} ${user.lastName}$`, 'i') } });
    if (doctor) {
      doctor.name = `${firstName} ${lastName}`;
      doctor.specialty = specialization || doctor.specialty;
      doctor.location = location || doctor.location;
      doctor.avatarInitials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      await doctor.save();
    }

    res.json({ message: 'Doctor updated', doctor: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// Get single appointment
router.get('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('user doctor', 'firstName lastName email');
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update appointment (status + date/time)
router.put('/appointments/:id', async (req, res) => {
  try {
    const { status, date, time } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    if (status) appointment.status = status;
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;

    await appointment.save();
    res.json({ message: 'Appointment updated', appointment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete appointment
router.delete('/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
