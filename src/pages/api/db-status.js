import dbConnect from '@/utils/dbConnect';

export default async function handler(req, res) {
    try {
        await dbConnect();
        return res.status(200).json({ success: true, message: 'Database connected' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Database not connected', error: error.message });
    }
}