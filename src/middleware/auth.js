import { verifyCookie } from '@/utils/cookieUtils';

export default async function checkAuth(req, res, next) {
  const sessionCookie = req.cookies.session;
  
  if (!sessionCookie) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  try {
    const sessionData = verifyCookie(sessionCookie);
    
    if (!sessionData) {
      // Tampered cookie
      res.clearCookie('session');
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    // === NEW SECURITY CHECKS === //
    // 1. Validate IP address
    if (sessionData.ip !== req.ip) {
      console.warn(`IP mismatch: ${req.ip} vs ${sessionData.ip}`);
      res.clearCookie('session');
      return res.status(401).json({ success: false, message: 'Session invalidated' });
    }

    // 2. Validate user-agent (device fingerprint)
    if (sessionData.userAgent !== req.headers['user-agent']) {
      console.warn('Device fingerprint mismatch');
      res.clearCookie('session');
      return res.status(401).json({ success: false, message: 'Re-authenticate required' });
    }

    // 3. Check session age (24h max)
    const sessionAge = Date.now() - sessionData.timestamp;
    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
      res.clearCookie('session');
      return res.status(401).json({ success: false, message: 'Session expired' });
    }

    // Attach user data to request
    req.user = sessionData;
    next();

  } catch (error) {
    console.error('Auth error:', error);
    res.clearCookie('session');
    return res.status(500).json({ success: false, message: 'Authentication failed' });
  }
}