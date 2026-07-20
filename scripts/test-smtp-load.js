require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mailer = require('../api/_lib/mailer');

console.log('--- SMTP LOAD DIAGNOSTICS ---');
console.log('ENV EMAIL_USER:', process.env.EMAIL_USER);
console.log('ENV EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET');
console.log('-----------------------------');
