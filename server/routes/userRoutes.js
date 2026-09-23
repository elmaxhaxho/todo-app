const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const Project = require('../models/projects');
const Task = require('../models/tasks');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();


router.get(
    '/',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const users = await User.find({
                workspaceId: req.user.workspaceId
            })
                .select('-password')
                .sort({ createdAt: -1 })
                .lean();

            res.json(
                users.map(user => ({
                    ...user,
                    role: user.role || 'employee'
                }))
            );

        } catch (error) {

            console.error('Get users error:', error);

            res.status(500).json({
                message: 'Server error loading users.'
            });
        }
    }
);

router.post(
    '/',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const name = String(req.body.name || '').trim();
            const email = String(req.body.email || '')
                .trim()
                .toLowerCase();

            const password = String(req.body.password || '');

            const role =
                req.body.role === 'admin'
                    ? 'admin'
                    : 'employee';

            if (!name || !email || !password) {
                return res.status(400).json({
                    message:
                        'Name, email, and password are required.'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    message:
                        'Password must be at least 6 characters.'
                });
            }

            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(409).json({
                    message:
                        'An account with this email already exists.'
                });
            }

            const hashedPassword = await bcrypt.hash(
                password,
                12
            );

            const user = await User.create({
                name,
                email,
                password: hashedPassword,
                role,
                workspaceId: req.user.workspaceId
            });

            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                workspaceId: user.workspaceId
            });

        } catch (error) {

            console.error('Create user error:', error);

            res.status(500).json({
                message: 'Server error creating user.'
            });
        }
    }
);


router.put(
    '/profile',
    authMiddleware,
    async (req, res) => {

        try {

            const name = String(req.body.name || '').trim();
            const email = String(req.body.email || '')
                .trim()
                .toLowerCase();

            const newPassword =
                String(req.body.password || '');

            if (!name || !email) {
                return res.status(400).json({
                    message: 'Name and email are required.'
                });
            }

            const existingEmailUser = await User.findOne({
                email,
                _id: { $ne: req.user._id }
            });

            if (existingEmailUser) {
                return res.status(409).json({
                    message:
                        'Another account already uses this email.'
                });
            }

            const user = await User.findById(req.user._id);

            if (!user) {
                return res.status(404).json({
                    message: 'User not found.'
                });
            }

            user.name = name;
            user.email = email;

            if (newPassword) {

                if (newPassword.length < 6) {
                    return res.status(400).json({
                        message:
                            'Password must be at least 6 characters.'
                    });
                }

                user.password = await bcrypt.hash(
                    newPassword,
                    12
                );
            }

            await user.save();

            res.json({
                message: 'Profile updated successfully.',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    workspaceId: user.workspaceId
                }
            });

        } catch (error) {

            console.error('Update profile error:', error);

            res.status(500).json({
                message: 'Server error updating profile.'
            });
        }
    }
);


router.put(
    '/:id/role',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const role = req.body.role;

            if (!['admin', 'employee'].includes(role)) {
                return res.status(400).json({
                    message: 'Invalid role.'
                });
            }

            if (
                req.params.id ===
                    req.user._id.toString() &&
                role !== 'admin'
            ) {
                return res.status(400).json({
                    message:
                        'You cannot remove your own admin role.'
                });
            }

            const user = await User.findOneAndUpdate(
                {
                    _id: req.params.id,
                    workspaceId: req.user.workspaceId
                },
                { role },
                { new: true }
            ).select('-password');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found.'
                });
            }

            res.json(user);

        } catch (error) {

            console.error('Change role error:', error);

            res.status(500).json({
                message: 'Server error changing user role.'
            });
        }
    }
);

router.delete(
    '/:id',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            if (
                req.params.id ===
                req.user._id.toString()
            ) {
                return res.status(400).json({
                    message:
                        'You cannot delete your own account.'
                });
            }

            const user = await User.findOne({
                _id: req.params.id,
                workspaceId: req.user.workspaceId
            });

            if (!user) {
                return res.status(404).json({
                    message: 'User not found.'
                });
            }

            await Project.updateMany(
                {
                    workspaceId: req.user.workspaceId,
                    members: user._id
                },
                {
                    $pull: {
                        members: user._id
                    }
                }
            );

            await Task.updateMany(
                {
                    workspaceId: req.user.workspaceId,
                    assignedTo: user._id
                },
                {
                    $set: {
                        assignedTo: null
                    }
                }
            );

            await User.findByIdAndDelete(user._id);

            res.json({
                message: 'User deleted successfully.'
            });

        } catch (error) {

            console.error('Delete user error:', error);

            res.status(500).json({
                message: 'Server error deleting user.'
            });
        }
    }
);

module.exports = router;