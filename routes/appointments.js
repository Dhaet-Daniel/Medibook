const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// Get user's appointments
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.userId }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const appointment = new Appointment({
      user: req.userId,
      doctor: doctorId,
      doctorName: doctor.name,
      date: new Date(date),
      time,
      reason
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel appointment
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reschedule appointment (update date and time)
router.patch('/:id/reschedule', auth, async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ error: 'Date and time are required to reschedule.' });

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { date: new Date(date), time, status: 'rescheduled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;