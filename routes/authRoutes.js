const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).send('All fields are required.');
    }

    if (password !== confirmPassword) {
      return res.status(400).send('Passwords do not match.');
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      errors.general = 'Username or email already exists';
      return res.status(400).render('register', { errors, formData });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    // Redirect to login page after successful registration
    res.redirect('/login');

  } catch (err) {
    console.error('Register Error:', err);
    errors.general = 'Server error during registration';
    res.status(500).render('register', { errors, formData });
  }
});

// LOGIN POST
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

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      errors.general = 'Invalid username/email or password';
      return res.status(400).render('login', { errors, formData });
    }
    req.session.user = { _id: user._id, username: user.username, email: user.email };

    // Redirect to grocery page after successful login
    res.redirect('/grocery');

  } catch (err) {
    console.error('Login Error:', err);
    errors.general = 'Server error during login';
    res.status(500).render('login', { errors, formData });
  }
});


module.exports = router;
