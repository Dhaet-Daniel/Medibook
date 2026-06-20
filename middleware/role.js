const User = require('../models/User');

module.exports = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const user = await User.findById(req.userId);
      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.userRole = user.role;
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};