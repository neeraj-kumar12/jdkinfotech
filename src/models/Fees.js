const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
    title: String,
    amount: Number,
    status: {
        type: String,
        enum: ['Paid', 'Pending'],
    },
    course: String,
    instituteId: Number,
});

module.exports = mongoose.models.Fee || mongoose.model('Fee', FeeSchema);
