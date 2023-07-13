const express = require('express');
const ratingController = require('../controllers/ratingController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect, authController.permitOnly('customer'));

router.post('/rate-product', ratingController.rateProduct);

module.exports = router;
