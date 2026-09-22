const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({

    name: { type: String, required: true, trim: true },
    company: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    createdAt: { type: Date, default: Date.now },
    deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Client', clientSchema);