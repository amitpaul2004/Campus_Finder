const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Lost', 'Found'],
        default: 'Found'
    },
    collectorName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    itemName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    dateReported: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    image: {
        type: String,     // Will store base64 string
        required: true
    },
    status: {
        type: String,
        enum: ['new', 'ready', 'pending', 'returned', 'expired', 'Pending', 'Resolved'], // Kept old ones just in case 
        default: 'new'
    },
    refId: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);
