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

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { studentId } = req.query;
    if (!studentId) {
        return res.status(400).json({ success: false, message: 'Missing studentId' });
    }

    try {
        const docs = await Document.find({ instituteId: studentId });

        const personalDocs = docs.filter(doc => doc.category === 'personal');
        const academicDocs = docs.filter(doc => doc.category === 'academic');

        res.status(200).json({
            success: true,
            data: {
                personalDocs,
                academicDocs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}