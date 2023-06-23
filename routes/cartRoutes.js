const express = require('express');

const router = express.Router();

const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

router.get('/getCart', authController.protect, cartController.getCart);
router.post(
  '/addToCart/:productID',
  authController.protect,
  cartController.addToCart
);
router.patch(
  '/removeFromCart/:productID',
  authController.protect,
  cartController.removeFromCart
);
router.patch(
  '/updateCart/:productID',
  authController.protect,
  cartController.updateCart
);
router.delete('/clearCart', authController.protect, cartController.clearCart);
router.delete('/deleteCart', authController.protect, cartController.deleteCart);

module.exports = router;
