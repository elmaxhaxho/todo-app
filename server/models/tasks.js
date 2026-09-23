const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({

    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: '',
        trim: true
    },

    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo'
    },

    label: {
        type: String,
        default: 'General',
        trim: true
    },

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    archived: {
        type: Boolean,
        default: false
    },

    deleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);