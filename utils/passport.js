const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const User = require('../models/userModel');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      callbackURL: '/auth/google/callback',
      clientID: process.env.GOOGLE_CLIENTID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.email });
        if (existingUser) {
          return done(null, existingUser);
        }
        const user = await new User({
          googleID: profile.id,
          name: profile.displayName,
          email: profile.email,
        }).save({ validateBeforeSave: false });
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
