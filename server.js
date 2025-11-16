require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const groceryRoutes = require('./routes/groceryRoutes');
const { isAuthenticated } = require('./middleware/auth');

const app = express();

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// === Middleware ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Session Setup ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sessions' }),
  cookie: { maxAge: 1000 * 60 * 60, httpOnly: true }, // 1 hour
}));

// === View Engine ===
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// === Make User Available in Views ===
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// === Routes ===
app.use('/', authRoutes);
app.use('/groceries', groceryRoutes);

// === Page Routes ===
app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login', { errors: null, formData: {} }));
app.get('/register', (req, res) => res.render('register', { errors: null, formData: {} }));

// === Protected Grocery Page ===
app.get('/grocery', isAuthenticated, (req, res) => {
  res.render('grocery', { user: req.session.user });
});

// === Logout ===
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

// Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
