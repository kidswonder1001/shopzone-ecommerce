const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const DELIVERY_CHARGE = 49; // flat delivery charge; free above threshold
const FREE_DELIVERY_THRESHOLD = 999;

const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SZ${timestamp}${random}`;
};

// @desc  Place a new order (COD) - reads current cart, validates stock, creates order
// @route POST /api/orders
const placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress } = req.body;

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.mobile ||
      !shippingAddress.email ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    // Validate stock and build order items
    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const product = item.product;
      if (!product || product.status !== 'active') {
        return res.status(400).json({ success: false, message: `A product in your cart is no longer available` });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} unit(s) of "${product.name}" available`,
        });
      }
      const unitPrice = product.discountPrice || product.price;
      subtotal += unitPrice * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images && product.images[0] ? product.images[0] : '',
        price: unitPrice,
        quantity: item.quantity,
      });
    }

    const deliveryCharge = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    const totalAmount = subtotal + deliveryCharge;

    const order = await Order.create({
      orderId: generateOrderId(),
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'Pending',
    });

    // Decrement stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (err) {
    next(err);
  }
};

// @desc  Get logged-in user's orders
// @route GET /api/orders
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// @desc  Get single order (must belong to logged-in user)
// @route GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc  Cancel an order (only if Pending or Confirmed)
// @route PUT /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled once it is ${order.orderStatus}`,
      });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    res.json({ success: true, message: 'Order cancelled', order });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder };
