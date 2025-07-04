import dbConnect from '@/utils/dbConnect';
import Document from '@/models/Document';
import { verifyStaff } from '@/utils/authUtils';

export default async function handler(req, res) {
  await dbConnect();

  // Staff verification
  const staffCheck = await verifyStaff(req);
  if (!staffCheck.success) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const document = await Document.findOne({ _id: req.query.id });

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