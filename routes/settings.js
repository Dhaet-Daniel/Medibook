const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Setting = require('../models/Setting');

// Get all settings (admin only)
router.get('/', auth, role('admin'), async (req, res) => {
  try {
    const settings = await Setting.find();
    const settingsObj = {};
    settings.forEach(s => { settingsObj[s.key] = s.value; });
    res.json(settingsObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update multiple settings (admin only)
router.put('/', auth, role('admin'), async (req, res) => {
  try {
    const updates = req.body;
    const promises = Object.entries(updates).map(([key, value]) => {
      return Setting.findOneAndUpdate(
        { key },
        { value, updatedAt: new Date() },
        { upsert: true }
      );
    });
    await Promise.all(promises);
    res.json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset settings to default (admin only)
router.post('/reset', auth, role('admin'), async (req, res) => {
  try {
    const defaultSettings = [
      { key: 'siteName', value: 'MediBook Hospital' },
      { key: 'contactEmail', value: 'support@medibook.hospital' },
      { key: 'contactPhone', value: '+260 977 123 456' },
      { key: 'defaultAppointmentDuration', value: 30 },
      { key: 'maxAppointmentsPerDay', value: 10 },
      { key: 'allowSameDayBooking', value: true },
      { key: 'bookingWindowDays', value: 30 },
      { key: 'clinicName', value: 'MediBook Clinic' },
      { key: 'clinicAddress', value: '123 Main Street, City' },
      { key: 'timezone', value: 'Africa/Lusaka' },
      { key: 'defaultLanguage', value: 'en' }
    ];

    for (const setting of defaultSettings) {
      await Setting.findOneAndUpdate(
        { key: setting.key },
        { value: setting.value, updatedAt: new Date() },
        { upsert: true }
      );
    }
    res.json({ message: 'Settings reset to default' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;