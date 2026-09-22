
const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/tasks');
const Project = require('../models/projects');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

async function getTaskWithProject(taskId) {
    if (!mongoose.isValidObjectId(taskId)) return null;

    return Task.findOne({
        _id: taskId,
        deleted: { $ne: true }
    }).populate({
        path: 'projectId',
        select: 'owner members title archived deleted'
    });
}

function employeeCanAccessTask(task, userId) {
    if (!task?.projectId) return false;

    return task.projectId.members.some(
        id => id.toString() === userId.toString()
    );
}

router.get('/archived', authMiddleware, async (req, res) => {
    try {
        let tasks;

        if (req.user.role === 'admin') {
            tasks = await Task.find({
                archived: true,
                deleted: { $ne: true }
            })
                .populate('assignedTo', 'name email role')
                .populate('projectId', 'title archived deleted')
                .sort({ updatedAt: -1 });
        } else {
            const projects = await Project.find({
                members: req.user._id,
                deleted: { $ne: true }
            }).select('_id');

            const projectIds = projects.map(project => project._id);

            tasks = await Task.find({
                archived: true,
                deleted: { $ne: true },
                projectId: { $in: projectIds }
            })
                .populate('assignedTo', 'name email role')
                .populate('projectId', 'title archived deleted')
                .sort({ updatedAt: -1 });
        }

        res.json(tasks);

    } catch (error) {
        console.error('Get archived tasks error:', error);

        res.status(500).json({
            message: 'Server error loading archived tasks.'
        });
    }
});



router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();

        const description = String(
            req.body.description ?? req.body.desc ?? ''
        ).trim();

        const projectId = req.body.projectId;
        const status = req.body.status || 'todo';
        const label = String(req.body.label || 'General').trim();
        const assignedTo = req.body.assignedTo || null;

        if (!title || !projectId) {
            return res.status(400).json({
                message: 'Task title and project are required.'
            });
        }

        if (!['todo', 'in-progress', 'done'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid task status.'
            });
        }

        const project = await Project.findOne({
            _id: projectId,
            deleted: { $ne: true }
        });

        if (!project) {
            return res.status(404).json({
                message: 'Project not found.'
            });
        }

        if (project.archived) {
            return res.status(400).json({
                message: 'You cannot add tasks to an archived project.'
            });
        }

        if (assignedTo) {
            const isMember = project.members.some(
                id => id.toString() === assignedTo.toString()
            );

            const employee = await User.findOne({
                _id: assignedTo,
                role: 'employee'
            });

            if (!isMember || !employee) {
                return res.status(400).json({
                    message:
                        'The assignee must be an employee on this project.'
                });
            }
        }

        const task = await Task.create({
            projectId,
            title,
            description,
            status,
            label,
            assignedTo
        });

        await Project.findByIdAndUpdate(
            projectId,
            {
                $addToSet: {
                    tasks: task._id
                }
            }
        );

        res.status(201).json(
            await Task.findById(task._id)
                .populate('assignedTo', 'name email role')
        );

    } catch (error) {
        console.error('Create task error:', error);

        res.status(500).json({
            message: 'Server error creating task.'
        });
    }
});

router.put('/:taskId', authMiddleware, async (req, res) => {
    try {
        const task = await getTaskWithProject(req.params.taskId);

        if (!task || !task.projectId) {
            return res.status(404).json({
                message: 'Task not found.'
            });
        }

        const onlyStatusChange = Object.keys(req.body).every(
            key => key === 'status'
        );

        if (req.user.role !== 'admin') {
            if (
                !onlyStatusChange ||
                !employeeCanAccessTask(task, req.user._id)
            ) {
                return res.status(403).json({
                    message:
                        'You can only update the status of tasks in your assigned projects.'
                });
            }
        }

        if (req.body.status !== undefined) {
            if (!['todo', 'in-progress', 'done'].includes(req.body.status)) {
                return res.status(400).json({
                    message: 'Invalid task status.'
                });
            }

            task.status = req.body.status;
        }

        if (req.user.role === 'admin') {
            if (req.body.title !== undefined) {
                task.title = String(req.body.title).trim();
            }

            if (req.body.description !== undefined) {
                task.description = String(req.body.description).trim();
            }

            if (req.body.label !== undefined) {
                task.label = String(req.body.label).trim();
            }

            if (req.body.assignedTo !== undefined) {
                const assignedTo = req.body.assignedTo || null;

                if (assignedTo) {
                    const isMember = task.projectId.members.some(
                        id => id.toString() === assignedTo.toString()
                    );

                    const employee = await User.findOne({
                        _id: assignedTo,
                        role: 'employee'
                    });

                    if (!isMember || !employee) {
                        return res.status(400).json({
                            message:
                                'The assignee must be an employee on this project.'
                        });
                    }
                }

                task.assignedTo = assignedTo;
            }
        }

        await task.save();

        res.json(
            await Task.findById(task._id)
                .populate('assignedTo', 'name email role')
        );

    } catch (error) {
        console.error('Update task error:', error);

        res.status(500).json({
            message: 'Server error updating task.'
        });
    }
});


router.put(
    '/:taskId/archive',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const task = await Task.findOne({
                _id: req.params.taskId,
                deleted: { $ne: true }
            });

            if (!task) {
                return res.status(404).json({
                    message: 'Task not found.'
                });
            }

            task.archived = true;

            await task.save();

            res.json({
                message: 'Task archived successfully.'
            });

        } catch (error) {
            console.error('Archive task error:', error);

            res.status(500).json({
                message: 'Server error archiving task.'
            });
        }
    }
);


router.put(
    '/:taskId/restore',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const task = await Task.findOne({
                _id: req.params.taskId,
                deleted: { $ne: true }
            });

            if (!task) {
                return res.status(404).json({
                    message: 'Task not found.'
                });
            }

            task.archived = false;

            await task.save();

            res.json({
                message: 'Task restored successfully.'
            });

        } catch (error) {
            console.error('Restore task error:', error);

            res.status(500).json({
                message: 'Server error restoring task.'
            });
        }
    }
);

router.delete(
    '/:taskId',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const task = await Task.findOne({
                _id: req.params.taskId,
                deleted: { $ne: true }
            });

            if (!task) {
                return res.status(404).json({
                    message: 'Task not found.'
                });
            }

            task.deleted = true;
            task.archived = false;

            await task.save();

            res.json({
                message: 'Task deleted successfully.'
            });

        } catch (error) {
            console.error('Delete task error:', error);

            res.status(500).json({
                message: 'Server error deleting task.'
            });
        }
    }
);


module.exports = router;

