
const express = require('express');
const Client = require('../models/Client');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/', async (req, res) => {
    try {
        const clients = await Client.find({
            deleted: { $ne: true }
        }).sort({ createdAt: -1 });

        res.json(clients);

    } catch (error) {
        console.error('Get clients error:', error);

        res.status(500).json({
            message: 'Server error loading clients.'
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();

        if (!name) {
            return res.status(400).json({
                message: 'Client name is required.'
            });
        }

        const client = await Client.create({
            name,
            company: String(req.body.company || '').trim(),
            email: String(req.body.email || '').trim(),
            phone: String(req.body.phone || '').trim(),
            address: String(req.body.address || '').trim(),
            notes: String(req.body.notes || '').trim(),
            deleted: false
        });

        res.status(201).json(client);

    } catch (error) {
        console.error('Create client error:', error);

        res.status(500).json({
            message: 'Server error creating client.'
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updateData = {
            name: String(req.body.name || '').trim(),
            company: String(req.body.company || '').trim(),
            email: String(req.body.email || '').trim(),
            phone: String(req.body.phone || '').trim(),
            address: String(req.body.address || '').trim(),
            notes: String(req.body.notes || '').trim()
        };

        if (!updateData.name) {
            return res.status(400).json({
                message: 'Client name is required.'
            });
        }

        const client = await Client.findOneAndUpdate(
            {
                _id: req.params.id,
                deleted: { $ne: true }
            },
            updateData,
            {
                new: true
            }
        );

        if (!client) {
            return res.status(404).json({
                message: 'Client not found.'
            });
        }

        res.json(client);

    } catch (error) {
        console.error('Update client error:', error);

        res.status(500).json({
            message: 'Server error updating client.'
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const client = await Client.findOneAndUpdate(
            {
                _id: req.params.id,
                deleted: { $ne: true }
            },
            {
                deleted: true
            },
            {
                new: true
            }
        );

        if (!client) {
            return res.status(404).json({
                message: 'Client not found.'
            });
        }

        res.json({
            message: 'Client deleted successfully.'
        });

    } catch (error) {
        console.error('Delete client error:', error);

        res.status(500).json({
            message: 'Server error deleting client.'
        });
    }
});


module.exports = router;

