import crypto from 'crypto';

// Enhanced key configuration
const CURRENT_SECRET = process.env.COOKIE_SECRET;
const PREV_SECRET = process.env.PREV_COOKIE_SECRET || '';
const SALT = process.env.COOKIE_SALT;

// Security parameters
const KEY_ITERATIONS = 210000; // OWASP recommended minimum
const KEY_LENGTH = 32; // 256 bits
const DIGEST = 'sha512';
const AUTH_TAG_LENGTH = 16;

// Validate required environment variables
if (!CURRENT_SECRET || !SALT) {
  throw new Error('Missing required cookie encryption environment variables');
}

// Key derivation with error handling
let currentKey, previousKey;
try {
  currentKey = crypto.pbkdf2Sync(CURRENT_SECRET, SALT, KEY_ITERATIONS, KEY_LENGTH, DIGEST);
  previousKey = PREV_SECRET 
    ? crypto.pbkdf2Sync(PREV_SECRET, SALT, KEY_ITERATIONS, KEY_LENGTH, DIGEST) 
    : null;
} catch (error) {
  throw new Error(`Key derivation failed: ${error.message}`);
}

export function signCookie(data) {
    if (!data) throw new Error('No data provided for cookie signing');
    
    try {
        const jsonData = JSON.stringify(data);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv('aes-256-gcm', currentKey, iv, {
            authTagLength: AUTH_TAG_LENGTH
        });
        
        let encrypted = cipher.update(jsonData, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        
        const encryptedData = `${iv.toString('hex')}:${authTag}:${encrypted}`;
        
        const signature = crypto
            .createHmac('sha512', currentKey)
            .update(encryptedData)
            .digest('hex');
            
        return `${encryptedData}.${signature}`;
    } catch (error) {
        throw new Error('Cookie encryption failed');
    }
}

export function verifyCookie(signedData) {
    if (!signedData) {
        return null;
    }
    
    const parts = signedData.split('.');
    if (parts.length !== 2) {
        return null;
    }
    
    const [encryptedData, signature] = parts;
    const keysToTry = previousKey ? [currentKey, previousKey] : [currentKey];
    
    for (const key of keysToTry) {
        try {
            const expectedSignature = crypto
                .createHmac('sha512', key)
                .update(encryptedData)
                .digest('hex');
                
            if (!crypto.timingSafeEqual(
                Buffer.from(signature, 'hex'),
                Buffer.from(expectedSignature, 'hex')
            )) continue;
            
            const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
            if (!ivHex || !authTagHex || !encrypted) {
                return null;
            }
            
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, {
                authTagLength: AUTH_TAG_LENGTH
            });
            
            decipher.setAuthTag(authTag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            continue;
        }
    }
    
    return null;
}

export function rotateKeys(newSecret) {
    if (!newSecret) throw new Error('No new secret provided');
    
    try {
        const newKey = crypto.pbkdf2Sync(newSecret, SALT, KEY_ITERATIONS, KEY_LENGTH, DIGEST);
        previousKey = currentKey;
        currentKey = newKey;
        
        // Update environment variables
        if (typeof process !== 'undefined' && process.env) {
            process.env.PREV_COOKIE_SECRET = process.env.COOKIE_SECRET;
            process.env.COOKIE_SECRET = newSecret;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}