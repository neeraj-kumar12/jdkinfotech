import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import Document from '@/models/Document'; // Add Document model import
import { verifyStaff } from '@/utils/authUtils';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  await dbConnect();

  // Verify staff role
  const staffCheck = await verifyStaff(req);
  if (!staffCheck.success) {
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized',
      data: null 
    });
  }

  // Disable caching
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const { studentId } = req.query;

  try {
    // GET - Get single student
    if (req.method === 'GET') {
      let student;
      
      // Try both studentId and _id
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await Student.findById(studentId)
          .select('-password -__v')
          .lean();
      } 
      
      if (!student) {
        student = await Student.findOne({ studentId })
          .select('-password -__v')
          .lean();
      }

      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found',
          data: null,
          requestedId: studentId
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Student found',
        data: student
      });
    }

    // DELETE - Delete student and their documents
    if (req.method === 'DELETE') {
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required',
          data: null
        });
      }

      // First delete all documents associated with the student
      await Document.deleteMany({ studentId: studentId });

      // Then delete the student
      let deletedStudent;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        deletedStudent = await Student.findByIdAndDelete(studentId);
      } else {
        deletedStudent = await Student.findOneAndDelete({ studentId });
      }

      if (!deletedStudent) {
        return res.status(404).json({
          success: false,
          message: 'Student not found',
          data: null
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Student and all associated documents deleted successfully',
        data: null
      });
    }

    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      data: null 
    });

  } catch (error) {
    console.error('Error in student route:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message,
      data: null 
    });
  }
}