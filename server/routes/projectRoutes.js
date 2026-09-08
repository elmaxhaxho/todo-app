const express = require('express');
const mongoose = require('mongoose');
const Project = require('../models/projects');
const Task = require('../models/tasks');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

async function getProjectForMember(projectId, userId, includeArchived = false) {
    if (!mongoose.isValidObjectId(projectId)) return null;
    const query = { _id: projectId, members: userId, deleted: { $ne: true } };
    if (!includeArchived) query.archived = false;
    return Project.findOne(query);
}

async function buildProjects(filter, includeArchived = false) {
    const projects = await Project.find(filter)
        .populate('members', 'name email role')
        .sort({ createdAt: -1 })
        .lean();

    const projectIds = projects.map(project => project._id);
    const taskFilter = { projectId: { $in: projectIds }, deleted: { $ne: true } };
    if (!includeArchived) taskFilter.archived = false;

    const tasks = projectIds.length
        ? await Task.find(taskFilter)
            .populate('assignedTo', 'name email role')
            .sort({ createdAt: -1 })
            .lean()
        : [];

    const tasksByProject = new Map();
    for (const task of tasks) {
        const key = task.projectId.toString();
        if (!tasksByProject.has(key)) tasksByProject.set(key, []);
        tasksByProject.get(key).push(task);
    }

    return projects.map(project => ({
        ...project,
        tasks: tasksByProject.get(project._id.toString()) || []
    }));
}

router.get('/', authMiddleware, async (req, res) => {
    try {
        const filter = { deleted: { $ne: true }, archived: false };
        if (req.user.role !== 'admin') filter.members = req.user._id;
        res.json(await buildProjects(filter));
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error loading projects.' });
    }
});

router.get('/archive', authMiddleware, async (req, res) => {
    try {
        const filter = { deleted: { $ne: true }, archived: true };
        if (req.user.role !== 'admin') filter.members = req.user._id;
        res.json(await buildProjects(filter, true));
    } catch (error) {
        console.error('Get archive error:', error);
        res.status(500).json({ message: 'Server error loading archive.' });
    }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const description = String(req.body.description ?? req.body.desc ?? '').trim();
        const memberIds = Array.isArray(req.body.members) ? req.body.members : [];

        if (!title) return res.status(400).json({ message: 'Project title is required.' });

        const employees = await User.find({
            _id: { $in: memberIds },
            role: 'employee'
        }).select('_id');

        const validMemberIds = employees.map(user => user._id);

        const project = await Project.create({
            title,
            description,
            owner: req.user._id,
            members: validMemberIds,
            tasks: []
        });

        const populatedProject = await Project.findById(project._id)
            .populate('members', 'name email role');

        res.status(201).json({ ...populatedProject.toObject(), tasks: [] });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error creating project.' });
    }
});

router.put('/:projectId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const description = String(req.body.description ?? '').trim();
        const memberIds = Array.isArray(req.body.members) ? req.body.members : [];

        if (!title) return res.status(400).json({ message: 'Project title is required.' });

        const employees = await User.find({
            _id: { $in: memberIds },
            role: 'employee'
        }).select('_id');

        const project = await Project.findById(req.params.projectId);
        if (!project || project.deleted) return res.status(404).json({ message: 'Project not found.' });

        project.title = title;
        project.description = description;
        project.members = employees.map(user => user._id);
        await project.save();

        res.json(await Project.findById(project._id).populate('members', 'name email role'));
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error updating project.' });
    }
});

router.post('/:projectId/members', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) return res.status(400).json({ message: 'Member email is required.' });

        const project = await Project.findOne({ _id: req.params.projectId, deleted: { $ne: true } });
        if (!project) return res.status(404).json({ message: 'Project not found.' });

        const userToAdd = await User.findOne({ email, role: 'employee' });
        if (!userToAdd) return res.status(404).json({ message: 'No employee account exists with this email.' });

        if (project.members.some(memberId => memberId.toString() === userToAdd._id.toString())) {
            return res.status(409).json({ message: 'This user is already a member of the project.' });
        }

        project.members.push(userToAdd._id);
        await project.save();
        res.json({ message: 'Member added successfully.', user: { id: userToAdd._id, name: userToAdd.name, email: userToAdd.email } });
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: 'Server error adding member.' });
    }
});

router.put('/:projectId/archive', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId, deleted: { $ne: true } });
        if (!project) return res.status(404).json({ message: 'Project not found.' });

        project.archived = true;
        await project.save();
        res.json({ message: 'Project archived successfully.' });
    } catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ message: 'Server error archiving project.' });
    }
});

router.put('/:projectId/restore', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.projectId, deleted: { $ne: true } });
        if (!project) return res.status(404).json({ message: 'Project not found.' });

        project.archived = false;
        await project.save();
        res.json({ message: 'Project restored successfully.' });
    } catch (error) {
        console.error('Restore project error:', error);
        res.status(500).json({ message: 'Server error restoring project.' });
    }
});

router.delete('/:projectId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project || project.deleted) return res.status(404).json({ message: 'Project not found.' });

        await Task.updateMany(
            { projectId: project._id },
            { $set: { deleted: true, archived: false } }
        );

        project.deleted = true;
        project.archived = false;
        await project.save();

        res.json({ message: 'Project deleted successfully.' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error deleting project.' });
    }
});

module.exports = router;
