const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeCartItem } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeCartItem);

module.exports = router;
