import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import { verifyStaff } from '@/utils/authUtils';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  // Verify staff role
  const staffCheck = await verifyStaff(req);
  if (!staffCheck.success) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { studentId } = req.query;

  try {
    // First try to find by studentId (custom ID)
    let student = await Student.findOneAndUpdate(
      { studentId },
      { 
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: staffCheck.userId 
      },
      { new: true }
    ).select('-password -__v');

    // If not found by studentId, try by _id
    if (!student && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findByIdAndUpdate(
        studentId,
        { 
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: staffCheck.userId 
        },
        { new: true }
      ).select('-password -__v');
    }

    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Student verified successfully',
      data: student 
    });

  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}