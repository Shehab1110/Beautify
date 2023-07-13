const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Payment = require('../models/paymentModel');
const AppError = require('../utils/appError');
const Order = require('../models/orderModel');

exports.getCheckoutSession = async (req, order) => {
  // Create checkout session
  const lineItems = [];
  order.orderItems.forEach((item) => {
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: item.product.price * 100,
        product_data: {
          name: item.product.name,
        },
      },
      quantity: item.quantity,
    });
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get(
      'host'
    )}/api/v1/payments/success/?order=${order.id}&user=${req.user.id}`,
    cancel_url: `${req.protocol}://${req.get('host')}/orders/my-orders`,
    customer_email: req.user.email,
    client_reference_id: order.id,
    line_items: lineItems,
    mode: 'payment',
  });
  return session;
};

exports.createOrderCheckout = async (user, session) => {
  const order = session.client_reference_id;
  const totalPrice = session.amount_total / 100;
  console.log(user.id);
  const payment = await Payment.create({
    user: user.id,
    order,
    paymentMethod: 'Card',
    totalPrice,
  });
  return payment;
};

exports.confirmPayment = catchAsync(async (req, res, next) => {
  const { user, order } = req.query;
  if (!user || !order) {
    return next(new AppError('Invalid request!', 400));
  }
  const paidOrder = await Order.findByIdAndUpdate(order, {
    isPaid: true,
  });
  if (!paidOrder) {
    return next(new AppError('Order not found!', 404));
  }
  const payment = await Payment.findOneAndUpdate(
    { user, order },
    { paymentStatus: 'Paid' }
  );
  if (!payment) {
    return next(new AppError('Payment not found!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      payment,
    },
  });
});
