import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
}

const dbConnect = async () => {
    if (mongoose.connection.readyState >= 1) {
        // 1 = connected, 2 = connecting
        return;
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export default dbConnect;
