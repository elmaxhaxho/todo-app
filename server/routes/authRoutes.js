const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during signup.' });
  }
});






router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Uses process.env.JWT_SECRET or falls back to a default key
    const secretKey = process.env.JWT_SECRET || 'mysecretkey123';
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1d' });

    res.json({ token, name: user.name });
  } catch (err) {
    console.error('Login error details:', err); // Logs exact error to VS Code terminal
    res.status(500).json({ message: 'Server error during login.' });
  }
});




router.post('/logout', (req, res) => {

  res.json({ message: 'Logged out successfully.' });
});



module.exports = router;