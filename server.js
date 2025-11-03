// === Import Dependencies ===
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// === Route Imports ===
const authRoutes = require('./routes/authRoutes');
const groceryRoutes = require('./routes/groceryRoutes');
const { isAuthenticated } = require('./middleware/auth.js');

const app = express();

// === Middleware ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Session Setup ===
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
    },
  })
);

// === MongoDB Connection ===
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// === View Engine Setup ===
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// === Make User Available in Views ===
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// === Routes ===
// ✅ Mount auth routes at '/' so forms like /login and /register work directly
app.use('/', authRoutes);
app.use('/groceries', groceryRoutes);

// === Page Routes ===
// ✅ Reset errors and formData when user refreshes or visits pages directly
app.get('/', (req, res) => res.render('index'));

app.get('/login', (req, res) => {
  res.render('login', { errors: null, formData: {} });
});

app.get('/register', (req, res) => {
  res.render('register', { errors: null, formData: {} });
});

// === Protected Grocery Page ===
app.get('/grocery', isAuthenticated, (req, res) => {
  if (!req.session.user) {
    console.log('No user found in session');
    return res.redirect('/login');
  }
  res.render('grocery', { user: req.session.user });
});

// === Logout Route ===
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// === Start Server ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
