const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated } = require('./middleware/auth.js');
const groceryRoutes = require('./routes/groceryRoutes');

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


app.use(
  session({
    secret: 'MARGRET NANYONGA',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: 'mongodb://127.0.0.1:27017/groceryBuddy',
      collectionName: 'sessions',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60, 
      httpOnly: true,
    },
  })
);


mongoose.connect('mongodb://127.0.0.1:27017/groceryBuddy')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use('/auth', authRoutes);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


app.use('/groceries', groceryRoutes);

app.get('/', (req, res) => res.render('index'));

app.get('/login', (req, res) => {
  res.render('login', {
    successMessage: req.session.successMessage || null,
    errors: {},
    formData: {}
  });
  req.session.successMessage = null;
});

app.get('/register', (req, res) => {
  res.render('register', {
    errors: {},
    formData: {}
  });
});

app.get('/grocery', isAuthenticated, (req, res) => {
  if (!req.session.user) {
    console.log('No user found in session');
    return res.redirect('/login');
  }
  res.render('grocery', { user: req.session.user });
});


app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

app.post('/login', (req, res, next) => {
  req.url = '/login'; 
  authRoutes.handle(req, res, next);
});

app.post('/register', (req, res, next) => {
  req.url = '/register'; 
  authRoutes.handle(req, res, next);
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
