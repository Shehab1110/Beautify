const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const passport = require('passport');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/reOpenApp', authController.reOpenApp);
router.post('/signup', authController.signUp);
router.post(
  '/seller-signup',
  authController.protect,
  authController.permitOnly('admin'),
  authController.sellerSignUp
);
router.post('/login', authController.login);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);
router.patch(
  '/updateMe',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', authController.protect, userController.deleteMe);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    keepSessionInfo: false,
  })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    keepSessionInfo: false,
  }),
  async (req, res, next) => {
    const { user } = req;
    if (req.session) console.log(req.session);
    const token = await promisify(jwt.sign)(user.id, process.env.JWT_SECRET, {
      algorithm: 'HS256',
    });
    res.status(200).json({
      status: 'success',
      data: {
        user,
        token,
      },
    });
  }
);

module.exports = router;
