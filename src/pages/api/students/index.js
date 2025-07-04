import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import { verifyStaff } from '@/utils/authUtils';

export default async function handler(req, res) {
  await dbConnect();

  // Staff verification
  const staffCheck = await verifyStaff(req);
  if (!staffCheck.success) {
    return res.status(403).json({ 
      success: false, 
      message: 'Unauthorized',
      data: null 
    });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET all students (with optional filters)
  if (req.method === 'GET') {
    try {
      const { isVerified, search } = req.query;
      const query = {};
      
      if (isVerified !== undefined) {
        query.isVerified = isVerified === 'true';
      }

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const students = await Student.find(query)
        .select('-password -__v')
        .sort({ createdAt: -1 });

      return res.status(200).json({ 
        success: true, 
        count: students.length,
        students 
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: error.message 
      });
    }
  }

  // POST - Create new student
  else if (req.method === 'POST') {
    try {
      const studentData = req.body;
      
      // Check if student already exists
      const existingStudent = await Student.findOne({ 
        $or: [
          { studentId: studentData.studentId },
          { email: studentData.email }
        ]
      });

      if (existingStudent) {
        return res.status(400).json({ 
          success: false,
          message: 'Student with this ID or email already exists'
        });
      }

      const newStudent = await Student.create(studentData);
      return res.status(201).json({ 
        success: true, 
        student: newStudent 
      });
    } catch (error) {
      console.error('Error creating student:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating student',
        error: error.message 
      });
    }
  }

  return res.status(405).json({ 
    success: false, 
    message: 'Method not allowed' 
  });
}