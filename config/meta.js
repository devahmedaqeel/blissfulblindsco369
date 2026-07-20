require('dotenv').config();

module.exports = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  verifyToken: process.env.META_VERIFY_TOKEN || '',
  ownerWhatsappNumber: process.env.OWNER_WHATSAPP_NUMBER || '',
  apiVersion: 'v18.0'
};
