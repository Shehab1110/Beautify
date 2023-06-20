const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    required: true,
    default: 'Pending',
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0,
  },
});

paymentSchema.index({ user: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
