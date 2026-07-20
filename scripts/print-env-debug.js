require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log('--- DEBUG ENV VALUES ---');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'FOUND (' + process.env.EMAIL_USER + ')' : 'MISSING');
console.log('GREENAPI_ID:', process.env.GREENAPI_ID ? 'FOUND (' + process.env.GREENAPI_ID + ')' : 'MISSING');
console.log('MY_WHATSAPP:', process.env.MY_WHATSAPP ? 'FOUND (' + process.env.MY_WHATSAPP + ')' : 'MISSING');
console.log('IS_PRODUCTION:', process.env.VERCEL_ENV || process.env.NODE_ENV || 'Not Set');
console.log('------------------------');
