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

async function upsertSeedUser({ email, password, ...profile }) {
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email, password, ...profile });
  } else {
    Object.assign(user, profile);
    user.password = password;
  }

  await user.save();
  return user;
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    await Doctor.deleteMany();
    await Doctor.insertMany(doctors);
    console.log('Doctors seeded successfully.');

    await upsertSeedUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@medibook.com',
      password: 'admin123',
      dateOfBirth: new Date('1990-01-01'),
      role: 'admin'
    });
    console.log('Admin user ready: admin@medibook.com / admin123');

    await upsertSeedUser({
      firstName: 'Test',
      lastName: 'Doctor',
      email: 'doctor@medibook.com',
      password: 'doctor123',
      dateOfBirth: new Date('1985-05-15'),
      role: 'doctor',
      specialization: 'General Medicine',
      licenseNumber: 'DOC-TEST-001',
      qualification: 'MBBS',
      yearsOfExperience: 8
    });
    console.log('Doctor user ready: doctor@medibook.com / doctor123');

    process.exit();
  })
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
