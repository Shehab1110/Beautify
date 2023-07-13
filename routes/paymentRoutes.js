const express = require('express');

const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.get('/success', paymentController.confirmPayment);

module.exports = router;
