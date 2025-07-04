import dbConnect from '@/utils/dbConnect';
import Document from '@/models/Document';
import Student from '@/models/Student';
import { verifyStaff } from '@/utils/authUtils'; // Add this import

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

    try {
        // First get ALL documents (not just pending/rejected) to count approved ones
        const allDocs = await Document.find({
            status: { $in: ['Pending', 'Rejected', 'Approved'] }
        });

        if (allDocs.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'No documents found'
            });
        }

        // Get unique instituteIds from these documents
        const instituteIds = [...new Set(allDocs.map(doc => doc.instituteId))];

        // Get all students with these instituteIds
        const students = await Student.find({
            instituteId: { $in: instituteIds }
        }).select('fullName instituteId');

        // Count document statuses for each student
        const result = students.map(student => {
            const studentDocs = allDocs.filter(doc => 
                String(doc.instituteId) === String(student.instituteId)
            );

            return {
                name: student.fullName,
                instituteId: student.instituteId,
                documents: {
                    pending: studentDocs.filter(d => d.status === 'Pending').length,
                    rejected: studentDocs.filter(d => d.status === 'Rejected').length,
                    approved: studentDocs.filter(d => d.status === 'Approved').length,
                    total: studentDocs.length
                }
            };
        });

        // Filter to only show students with pending/rejected docs
        const filteredResult = result.filter(student => 
            student.documents.pending > 0 || student.documents.rejected > 0
        );

        res.status(200).json({
            success: true,
            data: filteredResult
        });

    } catch (error) {
        console.error('Error in pending documents API:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching pending documents'
        });
    }
}