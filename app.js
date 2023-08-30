const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const chalk = require('chalk');
const passport = require('passport');
const session = require('express-session');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');

const app = express();
const userRouter = require('./routes/userRoutes');
const productRouter = require('./routes/productRoutes');
const cartRouter = require('./routes/cartRoutes');
const orderRouter = require('./routes/orderRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const ratingRouter = require('./routes/ratingRoutes');
require('./utils/passport');

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  })
);

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Security HTTP headers
app.use(helmet());

// Development logging
console.log(chalk.green(process.env.NODE_ENV));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Setting a rate-limit for requests from the same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json({ limit: '5kb' }));

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rootPage.html'));
});

app.use('/api/v1/users', userRouter);

app.get(
  '/auth/google/callback',
  passport.authenticate('google'),
  async (req, res, next) => {
    const { user } = req;
    if (req.session) console.log(req.session);

    const token = await promisify(jwt.sign)(
      { id: user._id },
      process.env.JWT_SECRET
    );
    res.status(200).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  }
);

// Handling unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware
app.use(globalErrorController);

module.exports = app;
