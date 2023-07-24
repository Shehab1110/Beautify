/* eslint-disable import/no-extraneous-dependencies */
const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell your name!'],
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'Please provide your email!'],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email!'],
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
    password: {
      type: String,
      required: [true, 'Please provide a password!'],
      trim: true,
      minlength: 8,
      maxlength: 32,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password!'],
      trim: true,
      validate: {
        // This validator only works on CREATE and SAVE queries!
        validator: function (el) {
          return el === this.password;
        },
        message: `Password and password confirmation aren't the same!`,
      },
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    passwordChangeAt: Date,
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiry: {
      Date,
      select: false,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Encrypting User password before saving to DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

// Adding the passwordChangedAt property before saving th DB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.methods.checkPassword = async function (
  candidatePassword,
  password
) {
  return await bcrypt.compare(candidatePassword, password);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangeAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );

    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetTokenExpiry = Date.now() + 10000 * 60;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
