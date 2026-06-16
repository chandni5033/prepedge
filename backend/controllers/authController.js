const bcrypt        = require('bcryptjs');
const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const logger         = require('../utils/logger');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: generateToken(user._id), user: sanitize(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.password)
      return res.status(401).json({ message: 'This account uses Google login. Please click "Continue with Google".' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        _id:            user._id,
        name:           user.name,
        email:          user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.googleCallback = (req, res) => {
  try {
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    logger.error('Google OAuth callback failed', { error: err.message });
    res.redirect(`${process.env.CLIENT_URL}/login?error=token_failed`);
  }
};

function sanitize(u) {
  return { _id: u._id, name: u.name, email: u.email, profilePicture: u.profilePicture };
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Name cannot be empty' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim() },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both fields are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.password)
      return res.status(400).json({ message: 'Google account — no password to change' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // pre('save') hook hashes this — do not hash manually here
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

exports.setPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (user.password)
      return res.status(400).json({ message: 'Use change password instead' });

    user.password = newPassword; // pre('save') hook hashes this — do not hash manually here
    await user.save();
    res.json({ message: 'Password set successfully. You can now login with email.' });
  } catch (err) {
    next(err);
  }
};