const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/projects');
const Task = require('../models/tasks');
const Client = require('../models/Client');

const JWT_SECRET =
    process.env.JWT_SECRET || 'development_only_change_this_secret';

async function ensureWorkspace(user) {

    if (user.workspaceId) {
        return user;
    }

    let workspaceId;

    const existingWorkspaceUser = await User.findOne({
        workspaceId: { $exists: true, $ne: null }
    });

    if (existingWorkspaceUser?.workspaceId) {
        workspaceId = existingWorkspaceUser.workspaceId;
    } else {
        workspaceId = new mongoose.Types.ObjectId();
    }

    await User.updateMany(
        {
            workspaceId: { $exists: false }
        },
        {
            $set: { workspaceId }
        }
    );

    await User.updateMany(
        {
            workspaceId: null
        },
        {
            $set: { workspaceId }
        }
    );

    await Project.updateMany(
        {
            workspaceId: { $exists: false }
        },
        {
            $set: { workspaceId }
        }
    );

    await Task.updateMany(
        {
            workspaceId: { $exists: false }
        },
        {
            $set: { workspaceId }
        }
    );

    await Client.updateMany(
        {
            workspaceId: { $exists: false }
        },
        {
            $set: { workspaceId }
        }
    );

    user.workspaceId = workspaceId;
    return user;
}

module.exports = async function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;
    const token =
        authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

    if (!token) {
        return res.status(401).json({
            message: 'Access denied. Please log in.'
        });
    }

    try {

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: 'User account no longer exists.'
            });
        }

        if (!user.role) {
            user.role = 'admin';
        }

        await ensureWorkspace(user);
        await user.save();
        user.password = undefined;
        req.user = user;
        next();

    } catch (error) {

        console.error('Auth middleware error:', error);
        return res.status(401).json({
            message: 'Invalid or expired session.'
        });
    }
};