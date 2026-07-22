require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const Invoice = require('./models/Invoice');
const Appointment = require('./models/Appointment');

// Existing route imports
const authRoutes = require('./routes/auth');
const doctorPublicRoutes = require('./routes/doctors'); // renamed to avoid conflict
const appointmentRoutes = require('./routes/appointments');

// === Step 4: New imports ===
const doctorRoutes = require('./routes/doctor');   // doctor-specific routes
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patient');
const paymentRoutes = require('./routes/payments');
// Role middleware (adjust the path if your middleware is stored elsewhere)
const { authorize } = require('./middleware/role'); 

const app = express();

async function handlePaymentSuccess(paymentIntentId) {
  const invoice = await Invoice.findOne({ paymentIntentId });
  if (invoice && invoice.status === 'pending') {
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await invoice.save();

    await Appointment.findByIdAndUpdate(invoice.appointment, { status: 'confirmed' });
  }
}

async function handlePaymentFailure(paymentIntentId) {
  const invoice = await Invoice.findOne({ paymentIntentId });
  if (invoice) {
    invoice.status = 'failed';
    await invoice.save();
  }
}

// Middleware
app.use(cors());

app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(500).send('Stripe is not configured');
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send('Missing Stripe signature or webhook secret');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorPublicRoutes);      // keep existing public doctor routes
app.use('/api/appointments', appointmentRoutes);

// === Step 4: Mount new routes ===
app.use('/api/doctor', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', patientRoutes);

// Fallback for client-side routing (must be AFTER all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});