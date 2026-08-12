const Cart = require('../models/Cart');
const Product = require('../models/Product');

const populateCart = (cartQuery) =>
  cartQuery.populate('items.product', 'name price discountPrice images stock status slug');

// @desc  Get logged-in user's cart
// @route GET /api/cart
const getCart = async (req, res, next) => {
  try {
    let cart = await populateCart(Cart.findOne({ user: req.user._id }));
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

// @desc  Add item to cart
// @route POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    const requestedQty = existingItem ? existingItem.quantity + Number(quantity) : Number(quantity);

    if (requestedQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) available in stock`,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQty;
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    const populated = await populateCart(Cart.findOne({ _id: cart._id }));
    res.json({ success: true, message: 'Added to cart', cart: populated });
  } catch (err) {
    next(err);
  }
};

// @desc  Update quantity of a cart item
// @route PUT /api/cart/:productId
const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} unit(s) available` });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    item.quantity = quantity;
    await cart.save();

    const populated = await populateCart(Cart.findOne({ _id: cart._id }));
    res.json({ success: true, cart: populated });
  } catch (err) {
    next(err);
  }
};

// @desc  Remove item from cart
// @route DELETE /api/cart/:productId
const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();

    const populated = await populateCart(Cart.findOne({ _id: cart._id }));
    res.json({ success: true, message: 'Item removed', cart: populated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };
