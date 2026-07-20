const mongoose = require('mongoose');
const Order = require('../models/Order');

// Match simple standard names (letters, spaces, typical accents/punctuation)
const NAME_RE = /^[\p{L}\p{M} .'-]{2,80}$/u;
// Permissive phone regex to validate UK format but allow international numbers too
const PHONE_RE = /^[+\d][\d\s()-]{6,19}$/;
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// Match UK postcode formats
const UK_POSTCODE_RE = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;

/**
 * Escapes characters to prevent XSS.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes and strips HTML tags from a string.
 */
function sanitizeString(val) {
  if (typeof val !== 'string') return '';
  // Strip HTML tags
  let cleaned = val.replace(/<[^>]*>/g, '');
  // Collapse duplicate whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return escapeHtml(cleaned);
}

/**
 * Validates and sanitizes order form submission data.
 * @param {Object} body The request body containing the order information.
 * @returns {Object} An object with { valid: Boolean, errors: Object, data: Object }
 */
async function validateOrderSubmission(body) {
  const errors = {};
  const cleanData = { customer: {}, product: {}, scheduling: {}, pricing: {} };

  body = body || {};

  // 1. Honeypot check (anti-spam)
  if (body.website) {
    return { valid: false, errors: { _spam: true } };
  }

  // 2. Validate Customer Details
  const customer = body.customer || {};

  const name = sanitizeString(customer.name);
  if (!name) errors['customer.name'] = 'Customer name is required.';
  else if (!NAME_RE.test(name)) errors['customer.name'] = 'Customer name contains invalid characters.';
  cleanData.customer.name = name;

  cleanData.customer.companyName = sanitizeString(customer.companyName);

  const email = String(customer.email || '').trim().toLowerCase();
  if (!email) errors['customer.email'] = 'Email address is required.';
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors['customer.email'] = 'Please enter a valid email address.';
  cleanData.customer.email = email;

  const phone = sanitizeString(customer.phone);
  if (!phone) errors['customer.phone'] = 'Phone number is required.';
  else if (!PHONE_RE.test(phone)) errors['customer.phone'] = 'Please enter a valid phone number.';
  cleanData.customer.phone = phone;

  const whatsappNumber = sanitizeString(customer.whatsappNumber);
  if (!whatsappNumber) errors['customer.whatsappNumber'] = 'WhatsApp number is required.';
  else if (!PHONE_RE.test(whatsappNumber)) errors['customer.whatsappNumber'] = 'Please enter a valid WhatsApp number.';
  cleanData.customer.whatsappNumber = whatsappNumber;

  const address = sanitizeString(customer.address);
  if (!address) errors['customer.address'] = 'Installation address is required.';
  cleanData.customer.address = address;

  const postcode = sanitizeString(customer.postcode).toUpperCase();
  if (!postcode) errors['customer.postcode'] = 'Postcode is required.';
  else if (!UK_POSTCODE_RE.test(postcode)) errors['customer.postcode'] = 'Please enter a valid UK postcode.';
  cleanData.customer.postcode = postcode;

  const city = sanitizeString(customer.city);
  if (!city) errors['customer.city'] = 'City is required.';
  cleanData.customer.city = city;

  // 3. Validate Product Details
  const product = body.product || {};

  const productName = sanitizeString(product.name);
  if (!productName) errors['product.name'] = 'Product name is required.';
  cleanData.product.name = productName;

  const blindType = sanitizeString(product.blindType);
  if (!blindType) errors['product.blindType'] = 'Blind type is required.';
  cleanData.product.blindType = blindType;

  const colour = sanitizeString(product.colour);
  if (!colour) errors['product.colour'] = 'Colour is required.';
  cleanData.product.colour = colour;

  const fabric = sanitizeString(product.fabric);
  if (!fabric) errors['product.fabric'] = 'Fabric style/option is required.';
  cleanData.product.fabric = fabric;

  const width = Number(product.width);
  if (isNaN(width) || width <= 10 || width > 500) {
    errors['product.width'] = 'Width must be a valid number between 10cm and 500cm.';
  }
  cleanData.product.width = width;

  const height = Number(product.height);
  if (isNaN(height) || height <= 10 || height > 500) {
    errors['product.height'] = 'Height must be a valid number between 10cm and 500cm.';
  }
  cleanData.product.height = height;

  const quantity = Number(product.quantity);
  if (isNaN(quantity) || quantity < 1 || quantity > 100) {
    errors['product.quantity'] = 'Quantity must be a number between 1 and 100.';
  }
  cleanData.product.quantity = quantity;

  const room = sanitizeString(product.room);
  if (!room) errors['product.room'] = 'Room location is required.';
  cleanData.product.room = room;

  const fittingType = sanitizeString(product.fittingType);
  if (!fittingType || !['Inside Recess', 'Outside Recess'].includes(fittingType)) {
    errors['product.fittingType'] = 'Fitting type must be either Inside Recess or Outside Recess.';
  }
  cleanData.product.fittingType = fittingType;

  cleanData.product.installationRequired = !!product.installationRequired;

  // 4. Validate Scheduling details
  const scheduling = body.scheduling || {};

  const prefDateStr = sanitizeString(scheduling.preferredDate);
  if (!prefDateStr) {
    errors['scheduling.preferredDate'] = 'Preferred installation date is required.';
  } else {
    const parsedDate = new Date(prefDateStr);
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date().setHours(0,0,0,0)) {
      errors['scheduling.preferredDate'] = 'Preferred installation date must be a valid date in the future.';
    } else {
      cleanData.scheduling.preferredDate = parsedDate;
    }
  }

  const preferredTime = sanitizeString(scheduling.preferredTime);
  if (!preferredTime) errors['scheduling.preferredTime'] = 'Preferred time slot is required.';
  cleanData.scheduling.preferredTime = preferredTime;

  cleanData.scheduling.specialNotes = sanitizeString(scheduling.specialNotes);

  // 5. Prevent Duplicate Submissions (Check if same customer submitted same product details in last 5 minutes)
  if (Object.keys(errors).length === 0 && mongoose.connection.readyState === 1) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await Order.findOne({
      'customer.email': email,
      'product.blindType': blindType,
      'product.width': width,
      'product.height': height,
      'product.quantity': quantity,
      createdAt: { $gte: fiveMinutesAgo }
    });

    if (duplicate) {
      errors._general = 'A duplicate order has already been submitted recently. Please wait a few minutes before trying again.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: cleanData
  };
}

module.exports = {
  validateOrderSubmission,
  sanitizeString,
  escapeHtml
};
