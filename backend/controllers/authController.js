const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  isActive: user.isActive,
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: 'Account is deactivated. Contact an administrator.' });
  }

  res.json({
    token: signToken(user._id),
    user: formatUser(user),
  });
});

exports.register = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  if (userCount > 0 && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only administrators can create accounts.' });
  }

  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(400).json({ message: 'A user with this email already exists.' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: userCount === 0 ? 'admin' : role || 'cashier',
    phone,
  });

  res.status(201).json({
    token: userCount === 0 ? signToken(user._id) : undefined,
    user: formatUser(user),
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: formatUser(req.user) });
});
