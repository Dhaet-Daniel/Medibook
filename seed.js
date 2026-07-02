require('dotenv').config();
const mongoose = require('mongoose');

const Doctor = require('./models/Doctor');
const User = require('./models/User');

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
    console.log('Doctors seeded successfully.');

    let adminUser = await User.findOne({ email: 'admin@medibook.com' });
    if (!adminUser) adminUser = new User({ email: 'admin@medibook.com' });
    Object.assign(adminUser, {
      firstName: 'Admin',
      lastName: 'User',
      password: 'Admin123!',
      dateOfBirth: new Date('1980-01-01'),
      role: 'admin',
      phone: '+1234567890'
    });
    await adminUser.save();
    console.log('Admin user ready: admin@medibook.com / Admin123!');

    let doctorUser = await User.findOne({ email: 'doctor@medibook.com' });
    if (!doctorUser) doctorUser = new User({ email: 'doctor@medibook.com' });
    Object.assign(doctorUser, {
      firstName: 'Samuel',
      lastName: 'Mbeki',
      password: 'Doctor123!',
      dateOfBirth: new Date('1975-05-15'),
      role: 'doctor',
      specialization: 'Dermatology',
      licenseNumber: 'LIC-12345',
      qualification: 'MD, Dermatology',
      yearsOfExperience: 15,
      phone: '+1234567891',
      consultationFee: 150
    });
    await doctorUser.save();
    console.log('Doctor user ready: doctor@medibook.com / Doctor123!');

    process.exit();
  })
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
