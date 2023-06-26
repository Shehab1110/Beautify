const express = require('express');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const userController = require('../controllers/userController');

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

// For Seller
router.post(
  '/addProduct',
  authController.protect,
  authController.permitOnly('seller'),
  userController.addProduct
);

router.patch(
  '/update-product/:productID',
  authController.protect,
  authController.permitOnly('seller'),
  productController.updateProduct
);

router.delete(
  '/delete-product/:productID',
  authController.protect,
  authController.permitOnly('seller'),
  productController.deleteProduct
);

module.exports = router;
