const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0.0,
    },
  },
  {
    timestamps: true,
  }
);

// Preventing duplicate carts
cartSchema.index({ user: 1 }, { unique: true });

// Document middleware for populating the product field with the product's name and price
cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'cartItems.product',
    select: 'name price',
  });
  next();
});

// Instance method for calculating total price of the cart (this refers to the cart document)
cartSchema.methods.calcTotalPrice = async function () {
  let totalPrice = 0;
  this.cartItems.forEach((item) => {
    totalPrice += item.product.price * item.quantity;
  });
  this.totalPrice = totalPrice;
  await this.save();
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
