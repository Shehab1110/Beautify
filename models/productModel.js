const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [
        40,
        'A product name must have less or equal than 40 characters',
      ],
      minlength: [
        3,
        'A product name must have more or equal than 3 characters',
      ],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [
        200,
        'A product description must have less or equal than 200 characters',
      ],
      minlength: [
        10,
        'A product description must have more or equal than 10 characters',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'A product price must be greater than 0'],
    },
    image: {
      type: String,
      required: [true, 'Please provide an image'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['food', 'drinks', 'desserts'],
    },
    ratingNum: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 4.5,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 1, category: 1 }, { unique: true });
productSchema.index({ price: 1, category: 1 }, { unique: false });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;