const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity can not be less than 1.'],
          default: 1,
        },
      },
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function (v) {
          const regex = /^(\+20|0)?1[0125][0-9]{8}$/;
          return regex.test(v);
        },
        message: 'Please provide a valid phone number!',
      },
      required: [true, 'Please provide a phone number!'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash On Delivery', 'Card'],
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
        'Returned',
      ],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1 });

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'orderItems.product',
    select: 'name price image',
  });
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
