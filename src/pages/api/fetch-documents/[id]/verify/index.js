import dbConnect from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyStaff } from '@/utils/authUtils';

export default async function handler(req, res) {
    await dbConnect();

    // Staff verification
    const staffCheck = await verifyStaff(req);
    if (!staffCheck.success) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { id } = req.query;
    if (req.method !== 'PATCH') return res.status(405).json({ success: false, message: 'Method not allowed' });
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    try {
        const doc = await Document.findByIdAndUpdate(id, { status }, { new: true });
        if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
        res.status(200).json({ success: true, data: doc });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
}