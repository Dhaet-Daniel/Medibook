require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');               // ← added for password hashing

// Models
const Doctor = require('./models/Doctor');
const User = require('./models/User');            // ← added for user seeding

// Sample doctor data
const doctors = [
  { 
    name: 'Dr. Rachel Ahmed', 
    specialty: 'Cardiology', 
    location: 'Main Hospital', 
    rating: 5.0, 
    reviews: 127, 
    nextAvailable: 'Tomorrow, 9:00 AM', 
    avatarInitials: 'RA' 
  },
  { 
    name: 'Dr. Samuel Mbeki', 
    specialty: 'Dermatology', 
    location: 'West Wing', 
    rating: 4.2, 
    reviews: 89, 
    nextAvailable: '7 Apr, 2:30 PM', 
    avatarInitials: 'SM' 
  },
  { 
    name: 'Dr. Helen Clarke', 
    specialty: 'Neurology', 
    location: 'East Wing', 
    rating: 4.8, 
    reviews: 156, 
    nextAvailable: '9 Apr, 11:00 AM', 
    avatarInitials: 'HC' 
  }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    // --- Seed Doctors ---
    await Doctor.deleteMany();
    await Doctor.insertMany(doctors);
    console.log('✅ Doctors seeded successfully!');

    // --- Seed Admin User (optional, for testing) ---
    const adminEmail = 'admin@medibook.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: hashedPassword,
        dateOfBirth: new Date('1990-01-01'),
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created (admin@medibook.com / admin123)');
    } else {
      console.log('ℹ️ Admin user already exists, skipping.');
    }

    // --- (Optional) Seed a test Doctor User ---
    // Uncomment if you want a user with role 'doctor' for testing.
    /*
    const doctorEmail = 'doctor@medibook.com';
    const existingDoctor = await User.findOne({ email: doctorEmail });
    if (!existingDoctor) {
      const hashedPw = await bcrypt.hash('doctor123', 10);
      const doctorUser = new User({
        firstName: 'Test',
        lastName: 'Doctor',
        email: doctorEmail,
        password: hashedPw,
        dateOfBirth: new Date('1985-05-15'),
        role: 'doctor'
      });
      await doctorUser.save();
      console.log('✅ Doctor user created (doctor@medibook.com / doctor123)');
    } else {
      console.log('ℹ️ Doctor user already exists, skipping.');
    }
    */

    process.exit();
  })
  .catch(err => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });