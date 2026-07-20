require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/blissful-blinds',
  
  // Nodemailer credentials
  emailHost: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  emailPort: parseInt(process.env.EMAIL_PORT, 10) || 465,
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  ownerEmail: process.env.OWNER_EMAIL || 'info@blissfulblindsltd.co.uk',
  
  // WhatsApp settings
  ownerWhatsappNumber: process.env.OWNER_WHATSAPP_NUMBER || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  metaVerifyToken: process.env.META_VERIFY_TOKEN || '',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'blissful-blinds-super-secret-key-12345678',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h'
};

// Validate that important variables are set in production
if (config.isProduction) {
  if (config.jwtSecret === 'blissful-blinds-super-secret-key-12345678') {
    console.warn('⚠️ WARNING: Using default JWT_SECRET in production. Change it immediately.');
  }
  if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is required in production.');
  }
}

module.exports = config;
