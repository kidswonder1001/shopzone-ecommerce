const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc  Admin login
// @route POST /api/admin/login
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    const token = generateToken(admin._id, admin.role);
    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get admin dashboard stats
// @route GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [totalProducts, totalOrders, totalCustomers, pendingOrders, deliveredOrders, salesAgg] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments(),
        Order.countDocuments({ orderStatus: 'Pending' }),
        Order.countDocuments({ orderStatus: 'Delivered' }),
        Order.aggregate([
          { $match: { orderStatus: { $ne: 'Cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

    const totalSales = salesAgg.length > 0 ? salesAgg[0].total : 0;

    res.json({
      success: true,
      stats: {
        totalProducts,
        totalOrders,
        totalCustomers,
        pendingOrders,
        deliveredOrders,
        totalSales,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all orders (admin) with search/filter
// @route GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.mobile': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('user', 'name email phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    res.json({ success: true, count: orders.length, total, page: pageNum, pages: Math.ceil(total / limitNum), orders });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single order details (admin)
// @route GET /api/admin/orders/:id
const getAdminOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc  Update order status (admin)
// @route PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Restock if moving to Cancelled from a non-cancelled state
    if (orderStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      const Product = require('../models/Product');
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.orderStatus = orderStatus;
    if (orderStatus === 'Delivered') {
      order.paymentStatus = 'paid';
    }
    await order.save();

    res.json({ success: true, message: 'Order status updated', order });
  } catch (err) {
    next(err);
  }
};

// @desc  Get all customers (admin)
// @route GET /api/admin/customers
const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [customers, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, count: customers.length, total, page: pageNum, pages: Math.ceil(total / limitNum), customers });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single customer detail (admin)
// @route GET /api/admin/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const orders = await Order.find({ user: customer._id }).sort({ createdAt: -1 });
    res.json({ success: true, customer, orders });
  } catch (err) {
    next(err);
  }
};

// @desc  Activate/deactivate customer
// @route PUT /api/admin/customers/:id/status
const toggleCustomerStatus = async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    customer.isActive = !customer.isActive;
    await customer.save();
    res.json({ success: true, message: `Customer ${customer.isActive ? 'activated' : 'deactivated'}`, customer });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  adminLogin,
  getDashboard,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
  getCustomers,
  getCustomerById,
  toggleCustomerStatus,
};
