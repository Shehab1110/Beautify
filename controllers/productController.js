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
  const { id } = req.params;
  if (!id) return next(new AppError('Please provide an ID!', 400));
  if (!validator.isMongoId(id))
    return next(new AppError('Please provide a valid ID!', 400));
  const product = await Product.findById(id);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  const ratings = await Ratings.find({ product: id });
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
