const express = require('express');
const router = express.Router();
const Grocery = require('../models/groceryModel');

// Middleware to check login
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Please log in first.' });
  }
  next();
}

// Allowed categories
const ALLOWED_CATEGORIES = [
  'Produce', 'Dairy', 'Meat', 'Bakery',
  'Pantry', 'Frozen', 'Beverages',
  'Snacks', 'Other'
];

// Fetch groceries with optional filter
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const filter = req.query.filter;
    const user = req.session.user;
    if (!user || !user._id) {
      return res.status(401).json({ message: 'User session expired. Please log in again.' });
    }

    const query = { userId: user._id };
    if (filter === 'completed') query.completed = true;
    else if (filter === 'active') query.completed = false;

    const groceries = await Grocery.find(query).sort({ createdAt: -1 }).lean();

    // Ensure numeric values for frontend calculations
    const fixedGroceries = groceries.map(g => ({
      ...g,
      price: Number(g.price),
      quantity: Number(g.quantity)
    }));

    res.json(fixedGroceries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch groceries', error });
  }
});

// Add a new grocery item
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { name, quantity, category, price } = req.body;

    if (!name || !quantity || !category || price === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

    const user = req.session.user;
    if (!user || !user._id) {
      return res.status(401).json({ message: 'User not found in session. Please log in again.' });
    }

    const grocery = new Grocery({
      userId: user._id,
      name,
      quantity: Number(quantity),
      category,
      price: Number(price)
    });

    await grocery.save();
    res.status(201).json({ message: 'Item added successfully', grocery });
  } catch (error) {
    console.error('Add error:', error);
    res.status(500).json({ message: 'Failed to add grocery', error });
  }
});

// Update or Edit grocery details
router.put('/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { name, quantity, category, price } = req.body;

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category selected' });
    }

     const updateData = { name, category };
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (price !== undefined) updateData.price = Number(price);

    const grocery = await Grocery.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user._id },
      updateData,
      { new: true }
    );

    if (!grocery) return res.status(404).json({ message: 'Item not found' });

    res.json({ message: 'Item updated successfully', grocery });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update grocery', error });
  }
});

// Toggle "completed" status
router.put('/toggle/:id', isAuthenticated, async (req, res) => {
  try {
    const grocery = await Grocery.findOne({ _id: req.params.id, userId: req.session.user._id });
    if (!grocery) return res.status(404).json({ message: 'Item not found' });

    grocery.completed = !grocery.completed;
    await grocery.save();

    res.json({ message: 'Status toggled', grocery });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle status', error });
  }
});

// Delete single grocery item
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const grocery = await Grocery.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user._id
    });

    if (!grocery) return res.status(404).json({ message: 'Item not found' });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete grocery', error });
  }
});

// Clear all groceries for logged-in user
router.delete('/', isAuthenticated, async (req, res) => {
  try {
    await Grocery.deleteMany({ userId: req.session.user._id });
    res.json({ message: 'All groceries cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear groceries', error });
  }
});

module.exports = router;
