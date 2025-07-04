import mongoose from 'mongoose';

const ExistedIdsSchema = new mongoose.Schema({
    instituteId: {
        type: Number,
        required: true,
        unique: true,
        immutable: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: false,
    collection: 'existedIds'
});

// Strictly read-only implementation
ExistedIdsSchema.statics = {
    // Only allow finding IDs
    findById(id) {
        return this.findOne({ instituteId: id });
    }
};


export default mongoose.models.ExistedIds || 
       mongoose.model('ExistedIds', ExistedIdsSchema);