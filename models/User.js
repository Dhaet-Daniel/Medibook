const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  dateOfBirth: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // Notification preferences
  notifications: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  
  // Favorite doctors
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }]
});

// Role + doctor-specific fields
userSchema.add({
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  specialization: { type: String, default: '' },
  licenseNumber: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  qualification: { type: String, default: '' },
  yearsOfExperience: { type: Number, default: 0 },
  profilePhoto: { type: String, default: '' },
  bio: { type: String, default: '' },
  languages: [{ type: String }],
  consultationFee: { type: Number, default: 0 },
  onlineFee: { type: Number, default: 0 },
  appointmentDuration: { type: Number, default: 30 }
});

// No next() needed – just an async function
userSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
