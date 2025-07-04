import checkAuth from '@/middleware/auth';

export default async function handler(req, res) {
  // Apply auth check - ensure this properly verifies cookie signatures
  await checkAuth(req, res, () => {});

  if (!req.user) {
    // Middleware already sent response
    return;
  }

  // Additional security checks
  try {
    // 1. Verify the user still exists in DB (optional but recommended)
    // 2. Check account status (isActive/isVerified)
    
    return res.status(200).json({
      success: true,
      data: 'Protected content',
      user: { // Only return non-sensitive data
        instituteId: req.user.instituteId,
        role: req.user.role
        // Don't include sensitive session data
      },
      timestamp: new Date().toISOString() // Add security timestamp
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}