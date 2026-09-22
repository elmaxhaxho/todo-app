
const express = require('express');
const Project = require('../models/projects');
const Task = require('../models/tasks');
const Client = require('../models/Client');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const [
                totalProjects,
                totalTasks,
                totalClients,
                totalUsers,
                archivedProjects,
                archivedTasks
            ] = await Promise.all([
                Project.countDocuments({
                    deleted: { $ne: true }
                }),

                Task.countDocuments({
                    deleted: { $ne: true }
                }),

                Client.countDocuments({
                    deleted: { $ne: true }
                }),

                User.countDocuments(),

                Project.countDocuments({
                    archived: true,
                    deleted: { $ne: true }
                }),

                Task.countDocuments({
                    archived: true,
                    deleted: { $ne: true }
                })
            ]);

            return res.json({
                totalProjects,
                totalTasks,
                totalClients,
                totalUsers,
                archivedProjects,
                archivedTasks
            });
        }

        const projects = await Project.find({
            members: req.user._id,
            deleted: { $ne: true }
        })
            .select('_id archived')
            .lean();

        const projectIds = projects.map(project => project._id);

        const tasks = await Task.find({
            projectId: { $in: projectIds },
            deleted: { $ne: true }
        }).lean();

        const activeProjects = projects.filter(
            project => !project.archived
        ).length;

        const activeTasks = tasks.filter(
            task => !task.archived
        ).length;

        const pendingTasks = tasks.filter(
            task => !task.archived && task.status !== 'done'
        ).length;

        const completedTasks = tasks.filter(
            task => !task.archived && task.status === 'done'
        ).length;

        return res.json({
            myProjects: activeProjects,
            myTasks: activeTasks,
            myPendingTasks: pendingTasks,
            myCompletedTasks: completedTasks
        });

    } catch (error) {
        console.error('Dashboard error:', error);

        res.status(500).json({
            message: 'Server error loading dashboard.'
        });
    }
});

module.exports = router;
