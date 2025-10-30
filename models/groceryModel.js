const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
  },
  price: { 
    type: Number,
     required: true, 
    min: 0 
  },

  category: { 
    type: String, 
    required: true, 
    enum: [
      'Produce', 'Dairy', 'Meat', 'Bakery', 
      'Pantry', 'Frozen', 'Beverages', 
      'Snacks', 'Other'
    ] 
  },
  completed: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

module.exports = mongoose.model('Grocery', grocerySchema);
