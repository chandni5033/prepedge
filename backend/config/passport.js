const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

console.log("CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
console.log("CALLBACK URL:", "https://prepedge-lek5.onrender.com/api/auth/google/callback");

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'https://prepedge-lek5.onrender.com/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId:       profile.id,
        name:           profile.displayName,
        email:          profile.emails[0].value,
        profilePicture: profile.photos[0]?.value,
      });
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));