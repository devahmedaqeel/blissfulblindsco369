const NotificationLog = require('../models/NotificationLog');

// Green API only — per product decision, this order pipeline never falls
// back to CallMeBot or Meta Cloud API. Reads exactly these three vars.
const GREENAPI_ID = process.env.GREENAPI_ID || '';
const GREENAPI_TOKEN = process.env.GREENAPI_TOKEN || '';
const MY_WHATSAPP = process.env.MY_WHATSAPP || '';

// Vercel serverless functions don't guarantee code keeps running after the
// response is sent, so delivery must be awaited inside the request instead
// of fired-and-forgotten with setTimeout retries. Each call gets its own
// hard timeout so a slow/unreachable Green API can never stall the booking
// response or blow through the function's execution limit.
const GREEN_API_TIMEOUT_MS = 6000;

function isGreenApiConfigured() {
  return !!(GREENAPI_ID && GREENAPI_TOKEN && MY_WHATSAPP);
}

// Matches the normalization already used by api/notify.js so both Green API
// integrations behave identically: strip everything but digits, then append
// the fixed Green API suffix (e.g. 447341645339@c.us).
function toChatId(rawNumber) {
  const digits = String(rawNumber).replace(/[^\d]/g, '');
  return `${digits}@c.us`;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Field-for-field mirror of the owner alert email (services/emailService.js
 * -> sendOwnerAlertEmail) so the owner sees identical information on both
 * channels — same saved Order document, same Google Maps link, no separate
 * data source. If a field is added to the owner email, add it here too.
 */
function formatOrderMessage(order, mapsLink) {
  const formattedDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London'
  });
  const timeSubmitted = new Date(order.createdAt || Date.now()).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
  });

  return `🚨 *NEW ORDER RECEIVED*
----------------------------------------
🌐 *Website:* Blissful Blinds Ltd (blissfulblindsltd.co.uk)
🆔 *Order ID:* ${order.orderId}
⏰ *Date & Time (UK):* ${timeSubmitted}

👤 *Customer Contact Details*
- *Name:* ${order.customer.name}
- *Company Name:* ${order.customer.companyName || 'None'}
- *Phone:* ${order.customer.phone}
- *Email:* ${order.customer.email}
- *Installation Address:* ${order.customer.address}, ${order.customer.city}, ${order.customer.postcode}

🪟 *Product Details*
- *Product Type:* ${order.product.name}
- *Blind Type:* ${order.product.blindType}
- *Colour:* ${order.product.colour}
- *Fabric:* ${order.product.fabric}
- *Room:* ${order.product.room}
- *Fitting Type:* ${order.product.fittingType} (${order.product.installationRequired ? 'Installation Required' : 'Supply Only'})
- *Width:* ${order.product.width} cm
- *Height:* ${order.product.height} cm
- *Quantity:* ${order.product.quantity}

💰 *Price Breakdown*
- *Subtotal:* £${order.pricing.subtotal.toFixed(2)}
- *VAT (20%):* £${order.pricing.vat.toFixed(2)}
- *Grand Total:* £${order.pricing.grandTotal.toFixed(2)}

📝 *Customer Notes:* ${order.scheduling.specialNotes || 'None'}
📅 *Preferred Installation:* ${formattedDate} (${order.scheduling.preferredTime})

📍 *Google Maps Link:*
${mapsLink || 'N/A'}

👉 *Admin Dashboard:*
https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}`;
}

async function sendGreenApiText(order, mapsLink, chatId) {
  const url = `https://api.green-api.com/waInstance${GREENAPI_ID}/sendMessage/${GREENAPI_TOKEN}`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message: formatOrderMessage(order, mapsLink) })
  }, GREEN_API_TIMEOUT_MS);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Green API sendMessage ${response.status}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

// sendFileByUpload sends the exact same in-memory PDF buffer directly as
// multipart form data in one call — no separate storage bucket, no public
// URL, and no second PDF generation, satisfying "upload only once if
// required" with the same buffer already attached to both emails.
async function sendGreenApiPdf(order, pdfBuffer, chatId) {
  const url = `https://api.green-api.com/waInstance${GREENAPI_ID}/sendFileByUpload/${GREENAPI_TOKEN}`;
  const form = new FormData();
  form.append('chatId', chatId);
  form.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `Order-${order.orderId}.pdf`);
  form.append('caption', `Invoice for Order ${order.orderId}`);

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: form
  }, GREEN_API_TIMEOUT_MS);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Green API sendFileByUpload ${response.status}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function alreadySent(orderId, notificationType) {
  const existing = await NotificationLog.findOne({ orderId, notificationType, status: 'Sent' });
  return !!existing;
}

async function logResult(orderId, notificationType, success, errorMsg) {
  await NotificationLog.findOneAndUpdate(
    { orderId, notificationType },
    {
      $set: { status: success ? 'Sent' : 'Failed', ...(success ? { deliveredAt: new Date() } : {}) },
      $push: { attempts: { attemptNumber: 1, success, errorMsg: errorMsg || '', timestamp: new Date() } },
      $inc: { failuresCount: success ? 0 : 1 }
    },
    { upsert: true }
  );
}

/**
 * Sends the owner's WhatsApp text alert and PDF invoice via Green API,
 * using the same Order document and PDF buffer as the emails. Awaited by
 * the caller so delivery is guaranteed to run to completion within the
 * request lifecycle. Never throws — every failure is caught, logged to
 * NotificationLog, and left there; the booking response is never affected.
 */
async function sendWhatsAppNotifications(order, pdfBuffer, mapsLink) {
  if (!isGreenApiConfigured()) {
    console.warn(`[WhatsApp] Skipping Green API notifications for order ${order.orderId}: GREENAPI_ID, GREENAPI_TOKEN or MY_WHATSAPP is not configured.`);
    return;
  }

  const chatId = toChatId(MY_WHATSAPP);

  // Text first, then the PDF, so the owner reads the summary before the
  // file lands — matches the order the owner email presents information in.
  if (await alreadySent(order.orderId, 'WhatsAppText')) {
    console.warn(`[WhatsApp] Skipping duplicate text send for order ${order.orderId} — already marked Sent.`);
  } else {
    try {
      await sendGreenApiText(order, mapsLink, chatId);
      await logResult(order.orderId, 'WhatsAppText', true);
      console.log(`[WhatsApp] Green API text sent for order ${order.orderId}.`);
    } catch (err) {
      console.error(`[WhatsApp] Green API text failed for order ${order.orderId}:`, err.message);
      await logResult(order.orderId, 'WhatsAppText', false, err.message);
    }
  }

  if (await alreadySent(order.orderId, 'WhatsAppPDF')) {
    console.warn(`[WhatsApp] Skipping duplicate PDF send for order ${order.orderId} — already marked Sent.`);
  } else {
    try {
      await sendGreenApiPdf(order, pdfBuffer, chatId);
      await logResult(order.orderId, 'WhatsAppPDF', true);
      console.log(`[WhatsApp] Green API PDF sent for order ${order.orderId}.`);
    } catch (err) {
      console.error(`[WhatsApp] Green API PDF failed for order ${order.orderId}:`, err.message);
      await logResult(order.orderId, 'WhatsAppPDF', false, err.message);
    }
  }
}

module.exports = {
  sendWhatsAppNotifications
};
