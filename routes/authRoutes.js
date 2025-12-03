const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// GET Register
router.get('/register', (req, res) => {
  res.render('register', { errors: {}, formData: {} });
});

// GET Login
router.get('/login', (req, res) => {
  const successMessage = req.session.successMessage;
  req.session.successMessage = null;

  res.render('login', {
    successMessage,
    errors: {},
    formData: {}
  });
});

// REGISTER POST
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  const errors = {};
  const formData = { username, email };

  if (!username || username.length < 3) errors.username = 'Username must be at least 3 characters';
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Invalid email';
  if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (Object.keys(errors).length > 0)
    return res.render('register', { errors, formData });

  try {
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      errors.general = 'Username or email already exists';
      return res.render('register', { errors, formData });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    req.session.successMessage = "Registration successful! You can now log in.";
    res.redirect('/login');

  } catch (err) {
    console.log(err);
    errors.general = "Server error during registration";
    res.render('register', { errors, formData });
  }
});

// LOGIN POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const errors = {};
  const formData = { username };

  if (!username || username.trim() === "")
    errors.username = "Username or Email is required";

  if (!password)
    errors.password = "Password is required";

  if (Object.keys(errors).length > 0)
    return res.render('login', { errors, formData });

  try {
    const input = username.trim();

    // login via email OR username
    const query = input.includes("@")
      ? { email: input.toLowerCase() }
      : { username: input };

    const user = await User.findOne(query);

    if (!user) {
      errors.general = "Invalid username/email or password";
      return res.render('login', { errors, formData });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      errors.general = "Invalid username/email or password";
      return res.render('login', { errors, formData });
    }

    // SAVE SESSION
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email
    };

    res.redirect('/grocery');

  } catch (err) {
    console.log(err);
    errors.general = "Server error during login";
    res.render('login', { errors, formData });
  }
});

router.get("/", (req, res) => {
  res.render("index");
});


router.post("/", (req, res) => {
  const data = req.body;

  console.log("POST data received:", data);

  res.send("POST route on index.pug reached successfully!");
});

module.exports = router;