const express = require('express');
const router = express.Router();
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
      return res.status(400).send('Username or email already exists.');
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    // Redirect to login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).send('Server error during registration');
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).send('Username/email and password are required.');
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(400).send('Invalid username/email or password.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).send('Invalid username/email or password.');
    }
    req.session.user = { _id: user._id, username: user.username, email: user.email };

    // Redirect to grocery page after successful login
    res.redirect('/grocery');
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).send('Server error during login');
  }
});


// LOGOUT ROUTE
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully.' });
  });
});

module.exports = router;
