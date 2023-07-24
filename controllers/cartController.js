const validator = require('validator');
const catchAsync = require('../utils/catchAsync');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');

exports.getCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('No cart found!', 404));
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (product.inStock === 0)
    return next(new AppError('The product is currently out of stock!', 400));
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    const newCart = await Cart.create({
      user: req.user.id,
      cartItems: [{ product: productID, quantity: 1 }],
      totalPrice: product.price,
    });
    return res.status(201).json({
      status: 'success',
      data: {
        cart: newCart,
      },
    });
  }
  const productIndex = cart.cartItems.findIndex(
    (item) => item.product._id.toString() === productID.toString()
  );
  if (productIndex === -1) {
    cart.cartItems.push({ product: productID, quantity: 1 });
  } else {
    cart.cartItems[productIndex].quantity += 1;
  }
  cart.totalPrice += product.price;
  await cart.save();
  res.status(201).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.removeFromCart = catchAsync(async (req, res, next) => {
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('No cart found!', 404));
  const productIndex = cart.cartItems.findIndex(
    (item) => item.product._id.toString() === productID
  );
  if (productIndex === -1)
    return next(
      new AppError('No product found in the cart with that ID!', 404)
    );
  cart.cartItems.splice(productIndex, 1);
  await cart.calcTotalPrice();
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.updateCart = catchAsync(async (req, res, next) => {
  const { productID } = req.params;
  const { quantity } = req.body;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  if (!quantity) return next(new AppError('Please provide a quantity!', 400));
  if (!validator.isNumeric(quantity) || quantity < 1)
    return next(new AppError('Please provide a valid quantity!', 400));
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('No cart found!', 404));
  const productIndex = cart.cartItems.findIndex(
    (item) => item.product._id.toString() === productID
  );
  if (productIndex === -1)
    return next(
      new AppError('No product found in the cart with that ID!', 404)
    );
  const product = await Product.findById(productID);
  if (quantity > product.inStock)
    return next(
      new AppError('The quantity you provided is not available! ', 400)
    );
  cart.cartItems[productIndex].quantity = quantity;
  cart = await cart.calcTotalPrice();
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.clearCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('No cart found!', 404));
  cart.cartItems = [];
  cart.totalPrice = 0;
  await cart.save();
  res.status(200).json({
    status: 'success',
    data: {
      cart,
    },
  });
});

exports.deleteCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('No cart found!', 404));
  await cart.remove();
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
