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

  // GET all students (with optional isVerified filter)
  if (req.method === 'GET') {
    try {
      const { isVerified } = req.query;
      const query = {};
      
      if (isVerified !== undefined) {
        query.isVerified = isVerified === 'true';
      }

      const students = await Student.find(query);
      res.status(200).json({ success: true, students });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}