const express = require('express');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Enforce auth check on all routes below
router.use(authMiddleware);

// GET: Fetch user's TODOs
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch TODOs.' });
  }
});

// POST: Create TODO
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'TODO title cannot be empty.' });
    }

    const newTodo = new Todo({
      title: title.trim(),
      description: description || '',
      user: req.userId // Attached from token
    });

    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create TODO.' });
  }
});

// PATCH: Update TODO
router.patch('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.userId }, // Verifies ownership
      req.body,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: 'TODO not found or unauthorized.' });
    }

    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update TODO.' });
  }
});

// DELETE: Delete TODO
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.userId });

    if (!todo) {
      return res.status(404).json({ message: 'TODO not found or unauthorized.' });
    }

    res.json({ message: 'TODO deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete TODO.' });
  }
});

module.exports = router;