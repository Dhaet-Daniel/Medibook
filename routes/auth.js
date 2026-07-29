const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, dateOfBirth } = req.body;

    // Validate: date of birth cannot be in the future
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // remove time part
    if (birthDate > today) {
      return res.status(400).json({ error: 'Date of birth cannot be in the future.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Create and save user
    const user = new User({ firstName, lastName, email, password, dateOfBirth });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, firstName, lastName, email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Set token expiry based on rememberMe
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn });

    res.json({
      token,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    await user.save();

    const updatedUser = await User.findById(req.userId).select('-password');
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET user notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('notifications');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update notification preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { email, sms, push } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.notifications = {
      email: typeof email === 'boolean' ? email : user.notifications.email,
      sms: typeof sms === 'boolean' ? sms : user.notifications.sms,
      push: typeof push === 'boolean' ? push : user.notifications.push
    };
    await user.save();
    res.json(user.notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


const { body } = require('express-validator');
const validateRequest = require('../middleware/validate');

// Registration validation
router.post('/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
    body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ min: 2, max: 50 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required').custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    })
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // ... your registration logic ...
    } catch (err) {
      next(err);
    }
  }
);

// Login validation
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      // ... your login logic ...
    } catch (err) {
      next(err);
    }
  }
);