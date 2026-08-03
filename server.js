require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Appointment = require('./models/Appointment');

// Existing route imports
const authRoutes = require('./routes/auth');
const doctorPublicRoutes = require('./routes/doctors'); // renamed to avoid conflict
const appointmentRoutes = require('./routes/appointments');

// === Step 4: New imports ===
const doctorRoutes = require('./routes/doctor');   // doctor-specific routes
const adminRoutes = require('./routes/admin');
const patientRoutes = require('./routes/patient');
const settingRoutes = require('./routes/settings');
// Role middleware (adjust the path if your middleware is stored elsewhere)
const { authorize } = require('./middleware/role'); 

const app = express();

// Middleware
app.use(cors());
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
app.use('/api', patientRoutes);
app.use('/api/settings', settingRoutes);

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

const { errorHandler } = require('./middleware/errorHandler');

// ... all routes ...

// Global error handler – must be last
app.use(errorHandler);