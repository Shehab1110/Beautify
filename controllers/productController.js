const validator = require('validator');

const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/APIFeatures');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const Ratings = require('../models/ratingsModel');

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

exports.getProductByID = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (!id) return next(new AppError('Please provide an ID!', 400));
  if (!validator.isMongoId(id))
    return next(new AppError('Please provide a valid ID!', 400));
  const product = await Product.findById(id);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  const ratings = await Ratings.find({ product: id });
  console.log(`Favorite Products: ${user.favoriteProducts}`);
  const favorites = user.favoriteProducts.map((p) => p.toString());
  console.log(`Products IDs in the array: ${favorites}`);
  console.log(favorites.includes(id));
  if (favorites.includes(id)) product.favorite = true;
  res.status(200).json({
    status: 'success',
    data: {
      product,
      ratings,
    },
  });
});

exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  if (!category) return next(new AppError('Please provide a category!', 400));
  if (
    ![
      'face',
      'eyes',
      'lips',
      'nails',
      'brushes and tools',
      'makeup removals',
      'skin care',
      'hair care',
      'bath and body',
    ].includes(category)
  )
    return next(new AppError('Please provide a valid category!', 400));
  const features = new APIFeatures(Product.find({ category }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;
  console.log(`Favorite Products: ${req.user.favoriteProducts}`);
  console.log(`Products IDs in the array: ${products.map((p) => p.id)}`);
  products.forEach((product) => {
    req.user.favoriteProducts.includes(product.id)
      ? (product.isFavorite = true)
      : null;
  });
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

exports.getProductByName = catchAsync(async (req, res, next) => {
  const { name } = req.params;
  if (!name) return next(new AppError('Please provide a name!', 400));
  const features = new APIFeatures(
    Product.find({ name: { $regex: name, $options: 'i' } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  const { name, description, price, category } = req.body;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (product.seller.id !== user.id)
    return next(new AppError('You are not authorized to do that!', 403));
  if (!name && !description && !price && !category)
    return next(new AppError('Please provide at least one field to update!'));

  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.category = category ?? product.category;
  await product.save();

  res.status(200).json({
    status: 'success',
    data: {
      product,
    },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (product.seller.id !== user.id)
    return next(new AppError('You are not authorized to do that!', 403));
  await product.remove();
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.addToFavorites = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (user.favoriteProducts.includes(productID))
    return next(new AppError('Product already in favorites!', 400));
  user.favoriteProducts.push(productID);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.removeFromFavorites = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (!user.favoriteProducts.includes(productID))
    return next(new AppError('Product not in favorites!', 400));
  user.favoriteProducts.splice(user.favoriteProducts.indexOf(productID), 1);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getFavorites = catchAsync(async (req, res, next) => {
  const { user } = req;
  const products = await Product.find({ _id: { $in: user.favoriteProducts } });
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});
