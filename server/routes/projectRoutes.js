const express = require('express');

const Project = require('../models/projects');
const Task = require('../models/tasks');
const User = require('../models/User');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

async function buildProjects(
    filter,
    workspaceId,
    includeArchived = false
) {

    const projects = await Project.find({
        ...filter,
        workspaceId
    })
        .populate('members', 'name email role')
        .sort({ createdAt: -1 })
        .lean();

    const projectIds = projects.map(
        project => project._id
    );

    const taskFilter = {
        projectId: { $in: projectIds },
        workspaceId,
        deleted: { $ne: true }
    };

    if (!includeArchived) {
        taskFilter.archived = false;
    }

    const tasks = projectIds.length
        ? await Task.find(taskFilter)
            .populate(
                'assignedTo',
                'name email role'
            )
            .sort({ createdAt: -1 })
            .lean()
        : [];

    const tasksByProject = new Map();

    for (const task of tasks) {

        const key = task.projectId.toString();

        if (!tasksByProject.has(key)) {
            tasksByProject.set(key, []);
        }

        tasksByProject
            .get(key)
            .push({
                ...task,
                id: task._id
            });
    }

    return projects.map(project => ({
        ...project,
        id: project._id,
        tasks:
            tasksByProject.get(
                project._id.toString()
            ) || []
    }));
}

router.get(
    '/',
    authMiddleware,
    async (req, res) => {

        try {

            const filter = {
                deleted: { $ne: true },
                archived: false
            };

            if (req.user.role !== 'admin') {
                filter.members = req.user._id;
            }

            res.json(
                await buildProjects(
                    filter,
                    req.user.workspaceId
                )
            );

        } catch (error) {

            console.error(
                'Get projects error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error loading projects.'
            });
        }
    }
);

/*
 * GET ARCHIVED PROJECTS
 */
router.get(
    '/archive',
    authMiddleware,
    async (req, res) => {

        try {

            const filter = {
                deleted: { $ne: true },
                archived: true
            };

            if (req.user.role !== 'admin') {
                filter.members = req.user._id;
            }

            res.json(
                await buildProjects(
                    filter,
                    req.user.workspaceId,
                    true
                )
            );

        } catch (error) {

            console.error(
                'Get archive error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error loading archive.'
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

            const title =
                String(req.body.title || '').trim();

            const description =
                String(
                    req.body.description ??
                    req.body.desc ??
                    ''
                ).trim();

            const memberIds =
                Array.isArray(req.body.members)
                    ? req.body.members
                    : [];

            if (!title) {
                return res.status(400).json({
                    message:
                        'Project title is required.'
                });
            }

            const employees = await User.find({
                _id: { $in: memberIds },
                workspaceId: req.user.workspaceId,
                role: 'employee'
            }).select('_id');

            const project = await Project.create({
                title,
                description,
                owner: req.user._id,
                workspaceId: req.user.workspaceId,
                members:
                    employees.map(
                        user => user._id
                    ),
                tasks: []
            });

            const populatedProject =
                await Project.findById(project._id)
                    .populate(
                        'members',
                        'name email role'
                    )
                    .lean();

            res.status(201).json({
                ...populatedProject,
                id: populatedProject._id,
                tasks: []
            });

        } catch (error) {

            console.error(
                'Create project error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error creating project.'
            });
        }
    }
);


router.put(
    '/:projectId',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const title =
                String(req.body.title || '').trim();

            const description =
                String(
                    req.body.description ?? ''
                ).trim();

            const memberIds =
                Array.isArray(req.body.members)
                    ? req.body.members
                    : [];

            if (!title) {
                return res.status(400).json({
                    message:
                        'Project title is required.'
                });
            }

            const employees = await User.find({
                _id: { $in: memberIds },
                workspaceId: req.user.workspaceId,
                role: 'employee'
            }).select('_id');

            const project = await Project.findOne({
                _id: req.params.projectId,
                workspaceId: req.user.workspaceId,
                deleted: { $ne: true }
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found.'
                });
            }

            project.title = title;
            project.description = description;
            project.members =
                employees.map(
                    user => user._id
                );

            await project.save();

            const updated =
                await Project.findById(project._id)
                    .populate(
                        'members',
                        'name email role'
                    )
                    .lean();

            res.json({
                ...updated,
                id: updated._id
            });

        } catch (error) {

            console.error(
                'Update project error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error updating project.'
            });
        }
    }
);


router.put(
    '/:projectId/archive',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const project = await Project.findOne({
                _id: req.params.projectId,
                workspaceId: req.user.workspaceId,
                deleted: { $ne: true }
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found.'
                });
            }

            project.archived = true;

            await project.save();

            res.json({
                message:
                    'Project archived successfully.'
            });

        } catch (error) {

            console.error(
                'Archive project error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error archiving project.'
            });
        }
    }
);


router.put(
    '/:projectId/restore',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const project = await Project.findOne({
                _id: req.params.projectId,
                workspaceId: req.user.workspaceId,
                deleted: { $ne: true }
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found.'
                });
            }

            project.archived = false;

            await project.save();

            res.json({
                message:
                    'Project restored successfully.'
            });

        } catch (error) {

            console.error(
                'Restore project error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error restoring project.'
            });
        }
    }
);

router.delete(
    '/:projectId',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {

        try {

            const project = await Project.findOne({
                _id: req.params.projectId,
                workspaceId: req.user.workspaceId
            });

            if (!project || project.deleted) {
                return res.status(404).json({
                    message: 'Project not found.'
                });
            }

            await Task.updateMany(
                {
                    projectId: project._id,
                    workspaceId: req.user.workspaceId
                },
                {
                    $set: {
                        deleted: true,
                        archived: false
                    }
                }
            );

            project.deleted = true;
            project.archived = false;

            await project.save();

            res.json({
                message:
                    'Project deleted successfully.'
            });

        } catch (error) {

            console.error(
                'Delete project error:',
                error
            );

            res.status(500).json({
                message:
                    'Server error deleting project.'
            });
        }
    }
);

module.exports = router;