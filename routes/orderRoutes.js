const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
