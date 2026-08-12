const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getDashboard,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  getCustomers,
  getCustomerById,
  toggleCustomerStatus,
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/login', authLimiter, adminLogin);
router.get('/dashboard', adminProtect, getDashboard);
router.get('/orders', adminProtect, getAllOrders);
router.get('/orders/:id', adminProtect, getAdminOrderById);
router.put('/orders/:id/status', adminProtect, updateOrderStatus);
router.get('/customers', adminProtect, getCustomers);
router.get('/customers/:id', adminProtect, getCustomerById);
router.put('/customers/:id/status', adminProtect, toggleCustomerStatus);

module.exports = router;
