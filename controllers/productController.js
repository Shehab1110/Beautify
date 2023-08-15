const validator = require('validator');

const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/APIFeatures');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const Ratings = require('../models/ratingsModel');

const multer = require('multer');
const sharp = require('sharp');

// To store the image in memory
const multerStorage = multer.memoryStorage();

// To accept only images and reject other files
const multerFilter = (req, file, cb) => {
  file.mimetype.startsWith('image')
    ? cb(null, true)
    : cb(new AppError('Not an image! Please upload only images.', 400), false);
};

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

exports.getBestSellingProducts = catchAsync(async (req, res, next) => {
  const products = await Product.find().sort('-soldCount').limit(15).cache();
  return products
    ? res.status(200).json({
        status: 'success',
        results: products.length,
        products,
      })
    : next(new AppError('No bestselling products found!', 404));
});

exports.getProductByID = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (!id) return next(new AppError('Please provide an ID!', 400));
  if (!validator.isMongoId(id))
    return next(new AppError('Please provide a valid ID!', 400));
  const [product, ratings] = await Promise.all([
    Product.findById(id).lean().cache({ expiryTime: 30 }),
    Ratings.find({ product: id }),
  ]);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  product.inWishlist = user.wishlist.includes(product._id);
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
  const features = new APIFeatures(
    Product.find({ category }).cache(),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;
  const response = products.map((el) => {
    obj = el.toObject();
    obj.inWishlist = req.user.wishlist.includes(el.id);
    return obj;
  });
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products: response,
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

// To upload the image to the memory
exports.uploadProductPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
}).single('photo');

// To resize the image and save it to the disk
exports.resizeProductPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `product-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.updateProduct = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  const { name, description, price, category, inStock } = req.body;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (product.seller.name !== user.name)
    return next(new AppError('You are not authorized to do that!', 403));
  if (!name && !description && !price && !category)
    return next(new AppError('Please provide at least one field to update!'));

  product.name = name ?? product.name;
  product.description = description ?? product.description;
  product.price = price ?? product.price;
  product.category = category ?? product.category;
  product.inStock = inStock ?? product.inStock;
  product.image = req.file.filename ?? product.image;
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

exports.addToWishlist = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (user.wishlist.includes(productID))
    return next(new AppError('Product already in wishlist!', 400));
  user.wishlist.push(productID);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { productID } = req.params;
  if (!productID)
    return next(new AppError('Please provide a product ID!', 400));
  if (!validator.isMongoId(productID))
    return next(new AppError('Please provide a valid product ID!', 400));
  const product = await Product.findById(productID);
  if (!product)
    return next(new AppError('No product found with that ID!', 404));
  if (!user.wishlist.includes(productID))
    return next(new AppError('Product not in wishlist!', 400));
  user.wishlist.splice(user.wishlist.indexOf(productID), 1);
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getWishlist = catchAsync(async (req, res, next) => {
  const { user } = req;
  const products = await Product.find({ _id: { $in: user.wishlist } });
  if (products.length === 0)
    return next(new AppError('Wishlist is empty!', 404));
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});
