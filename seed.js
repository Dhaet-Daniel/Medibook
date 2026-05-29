require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

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
    await Doctor.deleteMany();
    await Doctor.insertMany(doctors);
    console.log('✅ Doctors seeded successfully!');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });