const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated } = require('./middleware/auth.js');
const groceryRoutes = require('./routes/groceryRoutes');

const app = express();


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Session Setup
app.use(
  session({
    secret: 'MARGRET NANYONGA',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: 'mongodb://127.0.0.1:27017/groceryBuddy',
      collectionName: 'sessions',
    }),
    // 1 hour
    cookie: {
      maxAge: 1000 * 60 * 60, 
      httpOnly: true,
    },
  })
);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/groceryBuddy')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));


// View Engine 
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Routes

//Auth Routes 
app.use('/api/auth', authRoutes);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

//Grocery Routes 
app.use('/groceries', groceryRoutes);


app.get('/', (req, res) => res.render('index'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Grocery Page
app.get('/grocery', isAuthenticated, (req, res) => {
  if (!req.session.user) {
    console.log('No user found in session');
    return res.redirect('/login');
  }
  res.render('grocery', { user: req.session.user });
});

// Logout Shortcut
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});


// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
