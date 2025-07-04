import dbConnect from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyCookie } from '@/utils/cookieUtils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    await dbConnect();

    // Verify session
    const sessionCookie = req.cookies.session;
    if (!sessionCookie) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const sessionData = verifyCookie(sessionCookie);
    if (!sessionData) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session' 
      });
    }

    // Get documents for this instituteId
    const documents = await Document.find({ 
      instituteId: sessionData.instituteId 
    }).sort({ uploadedAt: -1 }).lean();

    return res.status(200).json({ 
      success: true,
      data: documents 
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}