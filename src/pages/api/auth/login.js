import bcrypt from 'bcryptjs';
import axios from 'axios';
import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import { signCookie } from '@/utils/cookieUtils';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Connect to database
    await dbConnect();
    
    const { instituteId, email, password, role, captchaToken } = req.body;
    console.log('[DEBUG] Login attempt for role:', role);
    console.log('[DEBUG] Email/InstituteId:', role === 'staff' ? email : instituteId);

    // Skip CAPTCHA for debugging - REMOVE THIS IN PRODUCTION
    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification required'
      });
    }

    // Role-based login
    if (role === 'staff') {
      // Fetch staff credentials from environment variables
      const envStaffEmail = process.env.DEV_STAFF_EMAIL?.toLowerCase();
      const envStaffPassword = process.env.DEV_STAFF_PASSWORD;
      const envStaffName = process.env.DEV_STAFF_NAME;
      const envStaffRole = process.env.DEV_STAFF_ROLE;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Check against env staff credentials
      if (
        email.toLowerCase() === envStaffEmail &&
        password === envStaffPassword
      ) {
        // Success - create session and set cookies
        const sessionData = {
          userId: 'env-staff',
          email: envStaffEmail,
          name: envStaffName,
          role: envStaffRole,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: Date.now()
        };

        const signedSession = signCookie(sessionData);
        const cookieOptions = [
          'HttpOnly',
          'Path=/',
          `Max-Age=${24 * 60 * 60}`,
          process.env.NODE_ENV === 'production' ? 'Secure' : '',
          'SameSite=Strict'
        ].filter(Boolean).join('; ');

        // Set session and staff info cookies
        res.setHeader('Set-Cookie', [
          `session=${signedSession}; ${cookieOptions}`,
          `staff_email=${encodeURIComponent(envStaffEmail)}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`,
          `staff_name=${encodeURIComponent(envStaffName)}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`,
          `staff_role=${encodeURIComponent(envStaffRole)}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`,
          `currentUser=${encodeURIComponent(JSON.stringify({
            email: envStaffEmail,
            fullName: envStaffName,
            role: envStaffRole
          }))}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; SameSite=Strict`
        ]);

        return res.status(200).json({
          success: true,
          user: {
            id: 'env-staff',
            email: envStaffEmail,
            name: envStaffName,
            role: envStaffRole
          }
        });
      }

      console.log('[DEBUG] Searching for staff with email:', email.toLowerCase());
      
      // First, let's see what's in the database
      try {
        const allStaff = await Staff.find({}).select('+password');
        console.log('[DEBUG] All staff in database:', allStaff.map(s => ({
          id: s._id,
          email: s.email,
          hasPassword: !!s.password
        })));
        
        // Try to find the specific staff member
        const staff = await Staff.findOne({ email: email.toLowerCase() }).select('+password');
        console.log('[DEBUG] Found staff:', staff ? {
          id: staff._id,
          email: staff.email,
          hasPassword: !!staff.password
        } : 'Not found');
        
        if (!staff) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials - staff not found'
          });
        }
        
        if (!staff.password) {
          console.log('[DEBUG] Staff found but no password field');
          return res.status(500).json({
            success: false,
            message: 'Account configuration error - no password'
          });
        }
        
        const isMatch = await bcrypt.compare(password, staff.password);
        console.log('[DEBUG] Password match:', isMatch);
        
        if (!isMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials - password mismatch'
          });
        }
        
        // Success - create session
        const sessionData = {
          userId: staff._id,
          role: staff.role,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: Date.now()
        };
        
        const signedSession = signCookie(sessionData);
        const cookieOptions = [
          'HttpOnly',
          'Path=/',
          `Max-Age=${24 * 60 * 60}`,
          process.env.NODE_ENV === 'production' ? 'Secure' : '',
          'SameSite=Strict'
        ].filter(Boolean).join('; ');
        
        res.setHeader('Set-Cookie', [
          `session=${signedSession}; ${cookieOptions}`
        ]);
        
        return res.status(200).json({
          success: true,
          user: {
            id: staff._id,
            email: staff.email,
            role: staff.role
          }
        });
        
      } catch (dbError) {
        console.error('[DEBUG] Database error:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Database error: ' + dbError.message
        });
      }
      
    } else {
      // Student login logic (keeping existing code)
      if (!instituteId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Institute ID and password are required'
        });
      }
      
      const numericInstituteId = Number(instituteId);
      if (isNaN(numericInstituteId)) {
        return res.status(400).json({
          success: false,
          message: 'Institute ID must be a number'
        });
      }
      
      const student = await Student.findOne({ instituteId: numericInstituteId })
        .select('+password isActive isVerified role fullName email instituteId');
        
      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      if (!student.password) {
        return res.status(500).json({
          success: false,
          message: 'Account configuration error'
        });
      }
      
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      if (student.isActive !== undefined && !student.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive'
        });
      }
      
      // Create session for student
      const sessionData = {
        userId: student._id,
        instituteId: student.instituteId,
        role: student.role,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        timestamp: Date.now()
      };
      
      const signedSession = signCookie(sessionData);
      const cookieOptions = [
        'HttpOnly',
        'Path=/',
        `Max-Age=${24 * 60 * 60}`,
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
        'SameSite=Strict'
      ].filter(Boolean).join('; ');
      
      const currentUser = {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        role: student.role,
        instituteId: student.instituteId
      };

      res.setHeader('Set-Cookie', [
        `session=${signedSession}; ${cookieOptions}`,
        `instituteId=${signCookie({ id: student.instituteId })}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}SameSite=Strict`,
        `currentUser=${encodeURIComponent(JSON.stringify(currentUser))}; Path=/; Max-Age=${24 * 60 * 60}; HttpOnly; SameSite=Strict`
      ]);
      
      return res.status(200).json({
        success: true,
        user: {
          id: student._id,
          instituteId: student.instituteId,
          fullName: student.fullName,
          email: student.email,
          role: student.role
        }
      });
    }

  } catch (error) {
    console.error('[DEBUG] Outer catch error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error: ' + error.message
    });
  }
  
  const match = cookie.match(/currentUser=([^;]+)/);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Not logged in', data: null });
  }
}