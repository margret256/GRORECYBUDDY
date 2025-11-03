const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// ======================= REGISTER ROUTE =======================
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const formData = { username, email, password, confirmPassword };
  const errors = {};

  // === Manual Validations ===
  if (!username || username.trim() === '') {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  }

  if (!email || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // If any validation failed, re-render form
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('register', { errors, formData });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      errors.username = 'Username or email already exists';
      return res.status(400).render('register', { errors, formData });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.redirect('/login');
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).render('register', {
      errors: { general: 'Server error during registration' },
      formData,
    });
  }
});


// ======================= LOGIN ROUTE =======================
router.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const formData = { username };
  const errors = {};

  // === Manual Validations ===
  if (!username || username.trim() === '') {
    errors.username = 'Username or Email is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render('login', { errors, formData });
  }

  try {
    // Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.status(400).render('login', {
        errors: { general: 'Invalid username/email or password' },
        formData,
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', {
        errors: { general: 'Invalid username/email or password' },
        formData,
      });
    }

    // Successful login
    req.session.user = { _id: user._id, username: user.username, email: user.email };
    res.redirect('/grocery');
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).render('login', {
      errors: { general: 'Server error during login' },
      formData,
    });
  }
});

module.exports = router;
