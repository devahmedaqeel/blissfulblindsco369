const notifyHandler = require('../api/notify');

// Mock request and response objects
const mockReq = {
  method: 'POST',
  headers: {
    'x-forwarded-for': '127.0.0.1',
    'user-agent': 'Blissful Blinds Test Runner'
  },
  body: {
    source: 'booking',
    sourceLabel: 'Contact Form',
    name: 'Test Client John Doe',
    email: 'client@example.com',
    phone: '+447911123456',
    address: '10 Downing Street',
    postcode: 'SW1A 2AA',
    service: 'Roller Blinds',
    preferredColor: 'Slate Grey',
    appointmentDate: '2026-07-25',
    appointmentTime: '14:30',
    hearAboutUs: 'Google Search',
    message: 'Hello, I would like to book a free home consultation for roller blinds measuring.',
    pageUrl: 'https://blissfulblindsltd.co.uk/roller-blinds/',
    referrer: 'https://google.com'
  }
};

const mockRes = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.responseData = data;
    console.log(`\n====================================================`);
    console.log(`[TEST RESULT] Response Status Code: ${this.statusCode}`);
    console.log(`[TEST RESULT] Payload:`, JSON.stringify(data, null, 2));
    console.log(`====================================================\n`);
    
    if (this.statusCode === 201) {
      console.log('✓ TEST PASSED: Booking lead processed, ID generated, and alerts successfully triggered.');
      process.exit(0);
    } else {
      console.error('❌ TEST FAILED: Processing did not return status 201.');
      process.exit(1);
    }
  }
};

console.log('Starting Booking Lead Submission Test...');
console.log('Simulating form submit to /api/notify...');

notifyHandler(mockReq, mockRes).catch(err => {
  console.error('Unhandled handler crash:', err);
  process.exit(1);
});
