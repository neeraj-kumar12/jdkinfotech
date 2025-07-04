// Updated current-user.js
import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import { verifyCookie } from '@/utils/cookieUtils';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.setHeader('Allow', ['GET'])
      .status(405)
      .json({ success: false, message: 'Method not allowed' });
  }

  const cookie = req.headers.cookie || '';
  const match = cookie.match(/currentUser=([^;]+)/);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Not logged in', data: null });
  }

  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    if (user.role === 'staff') {
      // Return staff data from .env.local
      return res.status(200).json({
        success: true,
        data: {
          email: process.env.DEV_STAFF_EMAIL,
          fullName: process.env.DEV_STAFF_NAME,
          role: process.env.DEV_STAFF_ROLE,
        }
      });
    } else {
      // fallback for students or others
      return res.status(200).json({ success: true, data: user });
    }
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid user cookie', data: null });
  }
}