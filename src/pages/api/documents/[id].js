import dbConnect from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyCookie } from '@/utils/cookieUtils';

export default async function handler(req, res) {
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

  try {
    const document = await Document.findOne({
      _id: req.query.id,
      instituteId: sessionData.instituteId
    });

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Handle GET request (download)
    if (req.method === 'GET') {
      res.setHeader('Content-Type', document.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name)}"`);
      return res.send(document.data);
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      await document.deleteOne();
      return res.status(200).json({ 
        success: true,
        message: 'Document deleted successfully'
      });
    }

    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });

  } catch (error) {
    console.error('Error handling document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}