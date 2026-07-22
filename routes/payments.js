const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Invoice = require('../models/Invoice');
const Appointment = require('../models/Appointment');
const { calculateFee } = require('../utils/pricing');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

router.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Create a PaymentIntent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe is not configured.' });
    }

    const { appointmentId } = req.body;

    // 1. Find the appointment and populate doctor
    const appointment = await Appointment.findById(appointmentId).populate('doctor');
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    if (appointment.user.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 2. Calculate fee from the stored appointment type or default to in-person
    const fee = await calculateFee(appointment.doctor, appointment.type || 'in-person');
    const amountInCents = Math.round(fee * 100); // Stripe expects cents

    // 3. Create PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { appointmentId: appointmentId.toString() },
    });

    // 4. Create pending invoice
    const invoice = new Invoice({
      user: req.userId,
      appointment: appointmentId,
      invoiceNumber: `INV-${Date.now()}`,
      amount: fee,
      currency: 'usd',
      status: 'pending',
      description: `Consultation fee for ${appointment.doctorName}`,
      paymentIntentId: paymentIntent.id,
    });
    await invoice.save();

    // 5. Return client secret to frontend
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;