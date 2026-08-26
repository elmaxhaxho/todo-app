const mongoose = require('mongoose');

const TodoSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  completed: {
    type: Boolean,
    default: false 
  }


}, { timestamps: true });




module.exports = mongoose.model('Todo', TodoSchema);
