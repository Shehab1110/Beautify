const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.permitOnly('customer'));

router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', orderController.getMyOrder);
router.post('/make-order', orderController.makeOrder);
router.patch('/cancel-order/:id', orderController.cancelOrder);

module.exports = router;
