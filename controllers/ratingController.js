const validator = require('validator');

const catchAsync = require('../utils/catchAsync');
const Ratings = require('../models/ratingsModel');
const Order = require('../models/orderModel');
const AppError = require('../utils/appError');

exports.rateProduct = catchAsync(async (req, res, next) => {
  const { productID, rating } = req.body;
  if (!productID || !rating)
    return next(new AppError('Please provide a product ID and a rating!', 400));
  if (
    !validator.isMongoId(productID) ||
    !validator.isInt(rating, { min: 1, max: 5 })
  )
    return next(
      new AppError(
        'Please provide a valid product ID and a rating between 1 and 5!',
        400
      )
    );
  const userID = req.user.id;
  const previousOrder = await Order.findOne({
    user: userID,
    'orderItems.product': productID,
    status: 'Delivered',
  });

  if (!previousOrder)
    return next(
      new AppError(
        'You can only rate products you have ordered and received!',
        400
      )
    );
  const newRating = await Ratings.create({
    product: productID,
    user: userID,
    rating,
  });
  res.status(200).json({
    status: 'success',
    data: {
      newRating,
    },
  });
});
