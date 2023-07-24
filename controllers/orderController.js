const validator = require('validator');

const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendOrderEmail } = require('../utils/email');
const {
  getCheckoutSession,
  createOrderCheckout,
} = require('./paymentController');

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });
  if (!orders) return next(new AppError('No orders found!', 404));
  const ordersByStatus = {
    Pending: [],
    Processing: [],
    Shipped: [],
    Delivered: [],
    Cancelled: [],
    Returned: [],
  };
  orders.forEach((order) => {
    const { status } = order;
    // eslint-disable-next-line no-prototype-builtins
    if (ordersByStatus.hasOwnProperty(status)) {
      ordersByStatus[status].push(order);
    }
  });
  const { Pending, Processing, Shipped, Delivered, Cancelled, Returned } =
    ordersByStatus;

  res.status(200).json({
    status: 'success',
    results: orders.length,
    data: {
      Pending,
      Processing,
      Shipped,
      Delivered,
      Cancelled,
      Returned,
    },
  });
});

exports.makeOrder = catchAsync(async (req, res, next) => {
  const { shippingAddress, city, paymentMethod, phoneNumber } = req.body;
  if (!shippingAddress || !city)
    return next(new AppError('Please provide shipping address and city!', 400));
  if (!paymentMethod)
    return next(new AppError('Please provide a payment method!', 400));
  if (paymentMethod !== 'Cash On Delivery' && paymentMethod !== 'Card')
    return next(new AppError('Please provide a valid payment method!', 400));
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart is empty!', 400));
  const order = await Order.create({
    user: req.user.id,
    orderItems: cart.cartItems,
    phoneNumber,
    shippingAddress: {
      address: shippingAddress,
      city,
    },
    paymentMethod,
    totalPrice: cart.totalPrice,
  });
  // Prepare the bulk update operations array
  const bulkUpdateOps = order.orderItems.map((orderItem) => {
    const productId = orderItem.product._id;
    const updatedInStock = orderItem.product.inStock - orderItem.quantity;

    return {
      updateOne: {
        filter: { _id: productId },
        update: {
          $set: { inStock: updatedInStock },
          $inc: { soldCount: orderItem.quantity },
        },
      },
    };
  });

  // Perform the bulk update operation
  await Product.bulkWrite(bulkUpdateOps);

  if (paymentMethod === 'Cash On Delivery') {
    res.status(201).json({
      status: 'success',
      data: {
        order,
      },
    });
  } else if (paymentMethod === 'Card') {
    const session = await getCheckoutSession(req, order);
    if (!session) return next(new AppError('Failed to create session!', 500));
    const checkout = await createOrderCheckout(req.user, session);
    if (!checkout) return next(new AppError('Failed to create checkout!', 500));
    res.status(201).json({
      status: 'success',
      data: {
        sessionURL: session.url,
        checkout,
      },
    });
  }
  await sendOrderEmail(req.user, order);
  await cart.remove();
});

exports.getMyOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || !validator.isMongoId(id))
    return next(new AppError('Please provide a valid order ID!', 400));
  const order = await Order.findById(id);
  if (!order) return next(new AppError('Order not found!', 404));
  await order.populate('orderItems.product');
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id || !validator.isMongoId(id))
    return next(new AppError('Please provide a valid order ID!', 400));
  const order = await Order.findById(id);
  console.log(JSON.stringify(order));
  if (!order) return next(new AppError('Order not found!', 404));
  if (order.status !== 'Pending')
    return next(new AppError('Order cannot be cancelled!', 400));
  // Prepare the bulk update operations array
  const bulkUpdateOps = order.orderItems.map((orderItem) => {
    const productId = orderItem.product._id;
    const updatedInStock = orderItem.product.inStock + orderItem.quantity;

    return {
      updateOne: {
        filter: { _id: productId },
        update: { $set: { inStock: updatedInStock } },
      },
    };
  });

  // Perform the bulk update operation
  await Product.bulkWrite(bulkUpdateOps);

  order.status = 'Cancelled';
  await order.save();
  res.status(200).json({
    status: 'success',
    data: {
      order,
    },
  });
});
