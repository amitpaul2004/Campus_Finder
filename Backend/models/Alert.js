const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    audience: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    sentViaEmail: {
        type: Boolean,
        default: false
    },
    time: {
        type: String, // Stringified 10:30 AM logic to match frontend UI identically
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
