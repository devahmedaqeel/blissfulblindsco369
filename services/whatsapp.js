const axios = require('axios');
const metaConfig = require('../config/meta');
const metaHelpers = require('../utils/metaHelpers');
const NotificationLog = require('../models/NotificationLog');

// Delays in seconds for retries (Index 0 = 5s, Index 1 = 15s, Index 2 = 30s)
const RETRY_DELAYS = [5, 15, 30];

// CallMeBot properties
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER || '+447341645339';
const CALLMEBOT_KEY = process.env.CALLMEBOT_API_KEY || '';

/**
 * Orchestrates sending both WhatsApp Text alert and WhatsApp PDF document to the owner.
 * Executes asynchronously in the background.
 * @param {Object} order The Order object
 * @param {Buffer} pdfBuffer The invoice PDF buffer
 */
async function sendWhatsAppNotifications(order, pdfBuffer) {
  // 1. CallMeBot Dispatch (Free, zero-config pathway)
  if (CALLMEBOT_KEY && CALLMEBOT_KEY !== 'YOUR_CALLMEBOT_KEY_HERE') {
    triggerWhatsAppMessageWithRetries(
      () => sendCallMeBotAlert(order),
      'WhatsAppText',
      order.orderId
    );
    return;
  }

  // 2. Meta Cloud API Dispatch (Fallback, premium pathway)
  if (!metaHelpers.validateMetaConfig()) {
    console.warn(`[WhatsApp] Skipping notifications for order ${order.orderId}: Meta credentials (token, phone number ID, or owner number) are not configured.`);
    return;
  }

  // Send text alert
  triggerWhatsAppMessageWithRetries(
    () => sendWhatsAppText(order),
    'WhatsAppText',
    order.orderId
  );

  // Send PDF document
  triggerWhatsAppMessageWithRetries(
    () => sendWhatsAppPDF(order, pdfBuffer),
    'WhatsAppPDF',
    order.orderId
  );
}

/**
 * Sends a message via CallMeBot API containing order details and a PDF download link.
 */
async function sendCallMeBotAlert(order) {
  const textBody = metaHelpers.formatWhatsAppTextBody(order);
  const pdfDownloadLink = `\n📥 *Download Invoice PDF:* \nhttps://blissfulblindsltd.co.uk/api/orders/${order.orderId}/invoice`;
  const fullText = textBody + pdfDownloadLink;
  
  const recipient = OWNER_WHATSAPP.replace(/[^\d+]/g, ''); // CallMeBot supports + in numbers
  const url = `https://api.callmebot.com/whatsapp.php`;

  const response = await axios.get(url, {
    params: {
      phone: recipient,
      text: fullText,
      apikey: CALLMEBOT_KEY
    }
  });

  return response.data;
}

/**
 * Posts text message to Meta API.
 */
async function sendWhatsAppText(order) {
  const textBody = metaHelpers.formatWhatsAppTextBody(order);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: metaConfig.ownerWhatsappNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: textBody
    }
  };

  const response = await axios.post(metaHelpers.getMetaUrl('messages'), payload, {
    headers: metaHelpers.getMetaHeaders()
  });

  return response.data;
}

/**
 * Uploads invoice PDF to Meta and sends it to the owner as a document.
 */
async function sendWhatsAppPDF(order, pdfBuffer) {
  // Upload PDF media to Meta
  const form = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  form.append('file', blob, `Order-${order.orderId}.pdf`);
  form.append('messaging_product', 'whatsapp');

  const uploadResponse = await axios.post(metaHelpers.getMetaUrl('media'), form, {
    headers: metaHelpers.getMetaHeaders('multipart/form-data')
  });

  const mediaId = uploadResponse.data.id;
  if (!mediaId) {
    throw new Error('Meta Media API upload succeeded but returned no media ID.');
  }

  // Send the document using the media ID
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: metaConfig.ownerWhatsappNumber,
    type: 'document',
    document: {
      id: mediaId,
      filename: `Order-${order.orderId}.pdf`
    }
  };

  const sendResponse = await axios.post(metaHelpers.getMetaUrl('messages'), payload, {
    headers: metaHelpers.getMetaHeaders()
  });

  return sendResponse.data;
}

/**
 * Executes a sending function with database logging and a timeout-based retry queue.
 */
async function triggerWhatsAppMessageWithRetries(sendFn, notificationType, orderId, attemptNumber = 1) {
  try {
    // Execute API call
    await sendFn();

    // Log attempt Success in MongoDB
    await NotificationLog.findOneAndUpdate(
      { orderId, notificationType },
      {
        $set: { status: 'Sent', deliveredAt: new Date() },
        $push: {
          attempts: {
            attemptNumber,
            success: true,
            timestamp: new Date()
          }
        }
      },
      { upsert: true }
    );

    console.log(`[WhatsApp] Sent ${notificationType} successfully for order ${orderId} (Attempt ${attemptNumber}).`);
  } catch (error) {
    const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error(`[WhatsApp] Failed to send ${notificationType} for order ${orderId} (Attempt ${attemptNumber}):`, errorMsg);

    // Log attempt failure in MongoDB
    const log = await NotificationLog.findOneAndUpdate(
      { orderId, notificationType },
      {
        $push: {
          attempts: {
            attemptNumber,
            success: false,
            errorMsg: errorMsg.slice(0, 1000), // Prevent storing overly massive API traces
            timestamp: new Date()
          }
        },
        $inc: { failuresCount: 1 }
      },
      { upsert: true, new: true }
    );

    // Retry logic
    if (attemptNumber <= RETRY_DELAYS.length) {
      const delaySeconds = RETRY_DELAYS[attemptNumber - 1];
      console.log(`[WhatsApp] Scheduling retry #${attemptNumber} for ${notificationType} (order ${orderId}) in ${delaySeconds} seconds.`);
      
      setTimeout(() => {
        triggerWhatsAppMessageWithRetries(sendFn, notificationType, orderId, attemptNumber + 1);
      }, delaySeconds * 1000);
    } else {
      // Out of attempts, mark as failed
      log.status = 'Failed';
      await log.save();
      console.error(`[WhatsApp] Exhausted all retries for ${notificationType} (order ${orderId}). Marked as Failed.`);
    }
  }
}

module.exports = {
  sendWhatsAppNotifications
};
