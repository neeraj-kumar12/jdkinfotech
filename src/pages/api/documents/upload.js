import dbConnect from '@/utils/dbConnect';
import Document from '@/models/Document';
import Student from '@/models/Student'; // Add this import at the top
import { verifyCookie } from '@/utils/cookieUtils';
import path from 'path';
import fetch from 'node-fetch';

// In-memory rate limiter (per instituteId)
const uploadAttempts = {};
const RATE_LIMIT = 10; // Max 10 uploads per window
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes in ms

// Magic numbers for file type validation
const MAGIC_NUMBERS = {
  PDF: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
  JPG: Buffer.from([0xFF, 0xD8, 0xFF]),
  PNG: Buffer.from([0x89, 0x50, 0x4E, 0x47]), // .PNG
};

// File size limit (1.5MB)
const MAX_SIZE = 1.5 * 1024 * 1024;

// --- Security Helpers ---
function checkMagicNumber(buffer, type) {
  if (type === 'PDF') return buffer.slice(0, 4).equals(MAGIC_NUMBERS.PDF);
  if (type === 'Image') {
    return (
      buffer.slice(0, 3).equals(MAGIC_NUMBERS.JPG) ||
      buffer.slice(0, 4).equals(MAGIC_NUMBERS.PNG)
    );
  }
  return false;
}

function sanitizeFilename(filename) {
  return path.basename(filename)
    .replace(/[^a-zA-Z0-9. _-]/g, '_'); // allow spaces by including space in the character set
}

async function scanWithClamAV(buffer) {
  // Implementation for ClamAV (if installed)
  // const scanResult = await clamav.scanBuffer(buffer);
  // return scanResult.isClean;
  return true; // Fallback if ClamAV not available
}

async function scanWithVirusTotal(buffer) {
  try {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) throw new Error('API key missing');

    // 1. Upload file
    const uploadRes = await fetch('https://www.virustotal.com/api/v3/files', {
      method: 'POST',
      headers: { 'x-apikey': apiKey },
      body: buffer,
    });
    const { data } = await uploadRes.json();

    // 2. Get analysis results (simplified - use webhooks in production)
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15s
    const analysisRes = await fetch(
      `https://www.virustotal.com/api/v3/analyses/${data.id}`,
      { headers: { 'x-apikey': apiKey } }
    );
    const analysis = await analysisRes.json();

    // 3. Check if any engines flagged as malicious
    return analysis.data.attributes.stats.malicious === 0;
  } catch (error) {
    console.error('VirusTotal error:', error);
    return true; // Fail open (allow upload) if scan fails
  }
}

// --- Main Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Check student verification status
    const student = await Student.findById(sessionData.userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (!student.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not verified.' 
      });
    }

    // In-memory rate limiting
    const now = Date.now();
    const userKey = sessionData.instituteId;
    if (!uploadAttempts[userKey]) uploadAttempts[userKey] = [];
    uploadAttempts[userKey] = uploadAttempts[userKey].filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (uploadAttempts[userKey].length >= RATE_LIMIT) {
      return res.status(429).json({ success: false, message: 'Too many uploads, please try again later.' });
    }
    uploadAttempts[userKey].push(now);

    // 3. Validate Input
    const { name, type, size, data, contentType, category } = req.body;
    if (!name || !type || !size || !data || !contentType || !category) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    // 4. Process File
    const buffer = Buffer.from(data, 'base64');
    
    // Size validation
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({ success: false, message: 'File too large' });
    }

    // Magic number validation
    if (!checkMagicNumber(buffer, type)) {
      return res.status(400).json({ success: false, message: 'Invalid file type' });
    }

    // 5. Virus Scanning (ClamAV > VirusTotal > Fallback)
    let isClean = await scanWithClamAV(buffer);
    if (!isClean && process.env.VIRUSTOTAL_API_KEY) {
      isClean = await scanWithVirusTotal(buffer);
    }

    if (!isClean) {
      return res.status(400).json({ success: false, message: 'Malicious content detected' });
    }

    // 6. Save to Database
    const document = new Document({
      name: sanitizeFilename(name),
      type,
      size,
      data: buffer,
      contentType,
      category,
      instituteId: sessionData.instituteId,
      uploadedAt: new Date()
    });

    await document.save();

    // 7. Response
    return res.status(201).json({
      success: true,
      data: {
        _id: document._id,
        name: document.name,
        type: document.type,
        size: document.size,
        category: document.category,
        uploadedAt: document.uploadedAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// --- File Download Handler (Example) ---
export async function downloadHandler(req, res) {
  try {
    const document = await Document.findById(req.query.id);
    if (!document) return res.status(404).send('Not found');

    // Critical security headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.send(Buffer.from(document.data));
  } catch (error) {
    return res.status(500).send('Download failed');
  }
}