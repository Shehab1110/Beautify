const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');

const router = express.Router();

router.get(
  '/getAllProducts',
  authController.protect,
  productController.getAllProducts
);

router.get(
  '/getProduct/:id',
  authController.protect,
  productController.getProductByID
);

router.get(
  '/getProductsByCategory/:category',
  authController.protect,
  productController.getProductsByCategory
);

router.get(
  '/getProductsByName/:name',
  authController.protect,
  productController.getProductByName
);

module.exports = router;
