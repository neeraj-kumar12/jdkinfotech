import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import { verifyStaff } from '@/utils/authUtils';

export default async function handler(req, res) {
  await dbConnect();

  // Verify staff role
  const staffCheck = await verifyStaff(req);
  if (!staffCheck.success) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const { studentId } = req.query;

  try {
    if (req.method === 'GET') {
      // Search by instituteId instead of _id
      const student = await Student.findOne({ instituteId: studentId })
        .select('-password -__v -createdAt -updatedAt');

      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found',
          data: null 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Student found',
        data: student 
      });
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in student route:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}