#!/usr/bin/env node
const mongoose = require('mongoose');
const Order = require('../models/Order');
const { validateOrderSubmission } = require('../utils/validation');
const { calculateOrderPricing } = require('../controllers/orderController');
const { generateInvoicePDF } = require('../services/pdfGenerator');
const { processOrderNotifications } = require('../services/notificationService');

require('dotenv').config();

// Standard test colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

let pass = 0;
let fail = 0;

function assert(label, condition, errorMsg = '') {
  if (condition) {
    pass++;
    console.log(`  ✓ ${GREEN}${label}${RESET}`);
  } else {
    fail++;
    console.error(`  ✗ ${RED}${label}${RESET}${errorMsg ? ` — ${errorMsg}` : ''}`);
  }
}

async function runTests() {
  console.log('\n====================================================');
  console.log('STARTING BLISSFUL BLINDS ORDER E2E UNIT TESTS');
  console.log('====================================================\n');

  // Test 1: Pricing Calculation Formulas
  console.log('[1] Testing Order Pricing Formulas...');
  const mockProduct = {
    width: 120,
    height: 150,
    quantity: 3,
    fittingType: 'Inside Recess',
    installationRequired: true
  };
  
  const pricing = calculateOrderPricing(mockProduct);
  // Math: base (35) + area (120*150*0.02 = 360) + recess (0) + install (25) = 420 per blind
  // 420 * 3 = 1260 subtotal. VAT = 252. Grand = 1512.
  assert('Calculates correct subtotal', pricing.subtotal === 1260.00, `Expected 1260, got ${pricing.subtotal}`);
  assert('Calculates correct 20% VAT', pricing.vat === 252.00, `Expected 252, got ${pricing.vat}`);
  assert('Calculates correct grand total', pricing.grandTotal === 1512.00, `Expected 1512, got ${pricing.grandTotal}`);

  // Test 2: Input Validator
  console.log('\n[2] Testing Order Form Validator & Honeypot...');
  const validPayload = {
    website: '', // empty honeypot
    customer: {
      name: 'Test Customer',
      companyName: '',
      email: 'customer@test.com',
      phone: '+447341645339',
      whatsappNumber: '+447341645339',
      address: '75 Ringwood Bretton',
      postcode: 'PE3 9SR',
      city: 'Peterborough'
    },
    product: {
      name: 'Perfect Fit Venetian Blind',
      blindType: 'Venetian',
      colour: 'White',
      fabric: 'Real Basswood',
      width: 120,
      height: 150,
      quantity: 3,
      room: 'Living Room',
      fittingType: 'Inside Recess',
      installationRequired: true
    },
    scheduling: {
      preferredDate: new Date(Date.now() + 7 * 24 * 3600e3).toISOString().slice(0,10),
      preferredTime: 'Morning (9am - 12pm)',
      specialNotes: 'Ring bell on arrival.'
    }
  };

  const validationResult = await validateOrderSubmission(validPayload);
  assert('Accepts a fully valid order payload', validationResult.valid, JSON.stringify(validationResult.errors));

  const spamPayload = { ...validPayload, website: 'spam-bot-fill' };
  const spamResult = await validateOrderSubmission(spamPayload);
  assert('Correctly flags honeypot spam bot fills as spam', !spamResult.valid && spamResult.errors._spam === true);

  const invalidPostcodePayload = JSON.parse(JSON.stringify(validPayload));
  invalidPostcodePayload.customer.postcode = 'NOT-A-POSTCODE';
  const postcodeResult = await validateOrderSubmission(invalidPostcodePayload);
  assert('Rejects invalid UK postcodes', !postcodeResult.valid && !!postcodeResult.errors['customer.postcode']);

  // Test 3: PDF Generation
  console.log('\n[3] Testing PDF Invoice compilation...');
  try {
    const mockOrder = {
      orderId: 'BB-20260720-9999',
      createdAt: new Date(),
      customer: validPayload.customer,
      product: validPayload.product,
      scheduling: {
        preferredDate: new Date(validPayload.scheduling.preferredDate),
        preferredTime: validPayload.scheduling.preferredTime,
        specialNotes: validPayload.scheduling.specialNotes
      },
      pricing: pricing
    };

    const pdfBuffer = await generateInvoicePDF(mockOrder);
    assert('Successfully creates invoice PDF buffer', Buffer.isBuffer(pdfBuffer));
    assert('Generated PDF buffer is non-empty', pdfBuffer.length > 5000, `Buffer size: ${pdfBuffer.length} bytes`);
  } catch (err) {
    assert('Compiles PDF invoice without throwing', false, err.message);
  }

  // Summary
  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${GREEN}${pass} passed${RESET}, ${RED}${fail} failed${RESET}`);
  console.log('====================================================\n');
  
  process.exit(fail === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('[E2E Tests] Uncaught test run crash:', err);
  process.exit(1);
});
