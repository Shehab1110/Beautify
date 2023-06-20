const mongoose = require('mongoose');
const Product = require('./productModel');

const ratingsSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    review: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

ratingsSchema.index({ product: 1, user: 1 }, { unique: true });

ratingsSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

ratingsSchema.statics.calcAverageRatings = async function (productID) {
  const stats = await this.aggregate([
    {
      $match: { product: productID },
    },
    {
      $group: {
        _id: '$product',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productID, {
      ratingNum: stats[0].nRating,
      rate: stats[0].avgRating,
    });
  } else {
    await Product.findByIdAndUpdate(productID, {
      ratingNum: 0,
      rate: 4.5,
    });
  }
};

// Document middleware for calculating average rating and quantity of ratings for a product after a new review is created
ratingsSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

// Query middleware for calculating average rating and quantity of ratings for a product after a review is updated or deleted
// ratingsSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   next();
// });
// // Query middleware for calculating average rating and quantity of ratings for a product after a review is updated or deleted
// ratingsSchema.post(/^findOneAnd/, async function () {
//   await this.r.constructor.calcAverageRatings(this.r.product);
// });

const Ratings = mongoose.model('Rating', ratingsSchema);

module.exports = Ratings;
