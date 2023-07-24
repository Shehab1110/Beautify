/* eslint-disable no-unused-expressions */
const multer = require('multer');
const sharp = require('sharp');
const validator = require('validator');

const User = require('../models/userModel');
const Product = require('../models/productModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// To store the image in memory
const multerStorage = multer.memoryStorage();

// To accept only images and reject other files
const multerFilter = (req, file, cb) => {
  file.mimetype.startsWith('image')
    ? cb(null, true)
    : cb(new AppError('Not an image! Please upload only images.', 400), false);
};

// To upload the image to the memory
exports.uploadUserPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
}).single('photo');

// To resize the image and save it to the disk
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

// For Authenticated User
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.file) req.body.photo = req.file.filename;
  if (!req.file) req.body.photo = req.user.photo;
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This route is not for updating password!', 401));
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
      photo: req.body.photo,
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// For Admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ active: { $ne: false } }).select('-__v');
  res.status(200).json({
    status: 'success',
    data: users,
  });
});

exports.addProduct = catchAsync(async (req, res, next) => {
  const { name, description, price, image, category } = req.body;
  const { user } = req;
  const newProduct = await Product.create({
    name,
    description,
    price,
    image,
    category,
    seller: {
      name: user.name,
      photo: user.photo,
      phoneNumber: user.phoneNumber,
      location: user.location,
    },
  });
  res.status(201).json({
    status: 'success',
    data: newProduct,
  });
});
