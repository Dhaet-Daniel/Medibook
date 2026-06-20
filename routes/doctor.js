const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

router.use(auth, role('doctor'));

// KPI
router.get('/kpi', async (req, res) => {
  const doctorId = req.userId;
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const todayCount = await Appointment.countDocuments({ doctor: doctorId, date: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } });
  const upcoming = await Appointment.countDocuments({ doctor: doctorId, date: { $gt: tomorrow }, status: 'upcoming' });
  const weeklyPatients = await Appointment.distinct('user', { doctor: doctorId, date: { $gte: new Date(Date.now() - 7*24*60*60*1000) } }).then(d => d.length);
  const pending = await Appointment.countDocuments({ doctor: doctorId, status: 'pending' });
  res.json({ today: todayCount, upcoming, weeklyPatients, pending });
});

// Today's schedule
router.get('/schedule/today', async (req, res) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const appointments = await Appointment.find({ doctor: req.userId, date: { $gte: today, $lt: tomorrow } }).populate('user', 'firstName lastName');
  res.json(appointments.map(a => ({ _id: a._id, time: a.time, patientName: `${a.user.firstName} ${a.user.lastName}` })));
});

// Upcoming appointments
router.get('/appointments/upcoming', async (req, res) => {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1); tomorrow.setHours(0,0,0,0);
  const appointments = await Appointment.find({ doctor: req.userId, date: { $gt: tomorrow }, status: 'upcoming' }).populate('user', 'firstName lastName').limit(10);
  res.json(appointments.map(a => ({ _id: a._id, date: a.date, time: a.time, patientName: `${a.user.firstName} ${a.user.lastName}` })));
});

// All appointments (with filters)
router.get('/appointments', async (req, res) => {
  const { status, startDate, endDate } = req.query;
  const query = { doctor: req.userId };
  if (status) query.status = status;
  if (startDate && endDate) query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  const appointments = await Appointment.find(query).populate('user', 'firstName lastName email phone').sort({ date: -1 });
  res.json(appointments);
});

// Patients list (distinct patients)
router.get('/patients', async (req, res) => {
  const patients = await Appointment.distinct('user', { doctor: req.userId });
  const patientDocs = await User.find({ _id: { $in: patients } }).select('firstName lastName email phone dateOfBirth');
  res.json(patientDocs);
});

// Availability – for simplicity, store in user doc as JSON
router.get('/availability', async (req, res) => {
  const user = await User.findById(req.userId).select('availability');
  res.json(user.availability || []);
});

router.put('/availability', async (req, res) => {
  const { availability } = req.body;
  await User.findByIdAndUpdate(req.userId, { availability });
  res.json({ message: 'Availability updated' });
});

module.exports = router;