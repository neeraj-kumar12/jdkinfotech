export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    // Clear all relevant cookies for both staff and students
    const cookieOptions = [
      'Path=/',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
      'SameSite=Strict'
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', [
      `session=; ${cookieOptions}`,
      `instituteId=; ${cookieOptions}`,
      `currentUser=; ${cookieOptions}`,
      `staff_email=; ${cookieOptions}`,
      `staff_name=; ${cookieOptions}`,
      `staff_role=; ${cookieOptions}`
    ]);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
}