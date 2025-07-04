// utils/authUtils.js
export function getCurrentUser(req) {
  try {
    const cookie = req.headers.cookie || '';
    const match = cookie.match(/currentUser=([^;]+)/);
    
    if (!match) {
      return { 
        success: false, 
        message: 'Not logged in',
        user: null
      };
    }

    const user = JSON.parse(decodeURIComponent(match[1]));
    return { 
      success: true, 
      user: {
        ...user,
        permissions: Array.isArray(user.permissions) ? user.permissions : []
      }
    };
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    return { 
      success: false, 
      message: 'Invalid session',
      user: null
    };
  }
}

export async function verifyStaff(req) {
  const { success, user } = getCurrentUser(req);
  if (success && user && user.role === 'staff') {
    return { success: true, user };
  }
  return { success: false };
}