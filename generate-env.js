const fs = require('fs');
const crypto = require('crypto');

const environments = ['.env.local'];

const commonSecrets = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/bcei',
  PORT: '4000',
  NODE_ENV: 'development',
  CLIENT_URL: 'http://localhost:3000',
  JWT_SECRET: crypto.randomBytes(64).toString('hex'),
  COOKIE_SECRET: crypto.randomBytes(32).toString('hex'),
  COOKIE_SALT: crypto.randomBytes(16).toString('hex'),
  PREV_COOKIE_SECRET: '', // For future rotation
  CSRF_SECRET: crypto.randomBytes(32).toString('hex')
};

environments.forEach(envFile => {
  const envSpecific = envFile === '.env.local' 
    ? { IS_LOCAL: 'true' } 
    : { IS_LOCAL: 'false' };

  const secrets = { ...commonSecrets, ...envSpecific };

  fs.writeFileSync(envFile, 
    Object.entries(secrets)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
  );

  console.log(`${envFile} generated successfully!`);
});