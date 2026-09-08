const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'development_only_change_this_secret';

function createToken(user) {
    return jwt.sign(
        { id: user._id.toString(), email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

function userResponse(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'admin'
    };
}

router.post('/signup', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const userCount = await User.countDocuments();
        if (userCount > 0) {
            return res.status(403).json({ message: 'New users can only be created by an admin.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashedPassword, role: 'admin' });
        const token = createToken(user);

        return res.status(201).json({
            message: 'Admin account created successfully.',
            token,
            user: userResponse(user)
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Server error during signup.' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide both email and password.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (!user.role) {
            user.role = 'admin';
            await user.save();
        }

        const token = createToken(user);

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: userResponse(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
