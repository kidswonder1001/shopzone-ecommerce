const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect admin routes - requires valid JWT for an Admin
const adminProtect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin no longer exists' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed or expired' });
  }
};

module.exports = { adminProtect };
