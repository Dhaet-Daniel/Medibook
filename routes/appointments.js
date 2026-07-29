const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const validateRequest = require('../middleware/validate');
const { body, param } = require('express-validator');

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
router.post(
  '/',
  auth,
  [
    body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
    body('date').isISO8601().withMessage('Valid date is required').custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason too long')
  ],
  validateRequest,
  async (req, res, next) => {
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
      next(err);
    }
  }
);

// Cancel appointment
router.patch(
  '/:id/cancel',
  auth,
  [param('id').isMongoId().withMessage('Invalid appointment ID')],
  validateRequest,
  async (req, res, next) => {
    try {
      const appointment = await Appointment.findOneAndUpdate(
        { _id: req.params.id, user: req.userId },
        { status: 'cancelled' },
        { new: true }
      );
      if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

// Reschedule appointment (update date and time)
router.patch(
  '/:id/reschedule',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid appointment ID'),
    body('date').isISO8601().withMessage('Valid date is required').custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Date cannot be in the past');
      }
      return true;
    }),
    body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { date, time } = req.body;
      const appointment = await Appointment.findOneAndUpdate(
        { _id: req.params.id, user: req.userId },
        { date: new Date(date), time, status: 'rescheduled' },
        { new: true }
      );
      if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
      res.json(appointment);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;