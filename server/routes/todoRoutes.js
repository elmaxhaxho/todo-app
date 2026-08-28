const express = require('express');
const Todo = require('../models/Todo');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);


router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.userId });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch TODOs.' });
  }
});


router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'TODO title cannot be empty.' });
    }

    const newTodo = new Todo({
      title: title.trim(),
      description: description || '',
      user: req.userId 
    });

    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create TODO.' });
  }
});


router.patch('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.userId }, 
      req.body,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: 'TODO not found.' });
    }

    res.json(todo);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update TODO.' });
  }
});




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


