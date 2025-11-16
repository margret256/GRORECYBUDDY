const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// =========================
//   GET LOGIN (SHOW PAGE)
// =========================
router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null; // clear message after showing

  res.render('login', {
    successMessage,
    errors: {},
    formData: {}
  });
});


// =========================
//        REGISTER POST
// =========================
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const formData = { username, email };
  const errors = {};

  // Backend validation
  if (!username || username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Invalid email';
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (Object.keys(errors).length > 0)
    return res.status(400).render('register', { errors, formData });

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      errors.general = 'Username or email already exists';
      return res.status(400).render('register', { errors, formData });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    // send success to login page
    req.session.successMessage = 'Registration successful! Please log in.';
    res.redirect('/login');

  } catch (err) {
    console.error('Register Error:', err);
    errors.general = 'Server error during registration';
    res.status(500).render('register', { errors, formData });
  }
});


// =========================
//          LOGIN POST
// =========================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const formData = { username };
  const errors = {};

  if (!username || username.trim() === '') errors.username = 'Username or Email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0)
    return res.status(400).render('login', { errors, formData });

  try {
    const cleanInput = username.trim();
    const query = cleanInput.includes('@')
      ? { email: cleanInput.toLowerCase() }
      : { username: cleanInput };

    const user = await User.findOne(query);
    if (!user) {
      errors.general = 'Invalid username/email or password';
      return res.status(400).render('login', { errors, formData });
    }

    // FIXED: missing password comparison
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      errors.general = 'Invalid username/email or password';
      return res.status(400).render('login', { errors, formData });
    }

    // store session user
    req.session.user = { _id: user._id, username: user.username, email: user.email };
    req.session.successMessage = `Welcome back, ${user.username}! Login successful.`;

    res.redirect('/grocery');

  } catch (err) {
    console.error('Login Error:', err);
    errors.general = 'Server error during login';
    res.status(500).render('login', { errors, formData });
  }
});


module.exports = router;
