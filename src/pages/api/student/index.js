import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import { verifyCookie } from '@/utils/cookieUtils';

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method === 'GET') {
      const { session, instituteId } = req.cookies;
      let instituteIdValue;

      if (session) {
        const sessionData = verifyCookie(session);
        if (!sessionData) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid session' 
          });
        }
        instituteIdValue = sessionData.instituteId;
      } 
      else if (instituteId) {
        const idData = verifyCookie(instituteId);
        if (!idData) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }
        instituteIdValue = idData.id;
      }
      else {
        return res.status(401).json({ 
          success: false, 
          message: 'Not authenticated' 
        });
      }

      const student = await Student.findOne({ instituteId: instituteIdValue })
        .select('-password -__v -createdAt -updatedAt')
        .lean();

      if (!student) {
        return res.status(404).json({ 
          success: false, 
          message: 'Student not found' 
        });
      }

      if (!student.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is inactive' 
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          personalInfo: {
            fullName: student.fullName,
            fatherName: student.fatherName,
            motherName: student.motherName,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            category: student.category,
            bloodGroup: student.bloodGroup,
            nationality: student.nationality,
            phone: student.phone,
            email: student.email,
            emergencyContact: student.emergencyContact
          },
          academicInfo: {
            course: student.course,
            session: student.session,
            batch: student.batch
          },
          address: {
            address: student.address,
            state: student.state,
            pinCode: student.pinCode
          },
          accountInfo: {
            instituteId: student.instituteId,
            role: student.role,
            isActive: student.isActive,
            isVerified: student.isVerified
          }
        }
      });
    }
    else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error' 
    });
  }
}