const axios = require('axios');
const metaConfig = require('../config/meta');
const metaHelpers = require('../utils/metaHelpers');
const NotificationLog = require('../models/NotificationLog');

// Delays in seconds for retries (Index 0 = 5s, Index 1 = 15s, Index 2 = 30s)
const RETRY_DELAYS = [5, 15, 30];

/**
 * Orchestrates sending both WhatsApp Text alert and WhatsApp PDF document to the owner.
 * Executes asynchronously in the background.
 * @param {Object} order The Order object
 * @param {Buffer} pdfBuffer The invoice PDF buffer
 */
async function sendWhatsAppNotifications(order, pdfBuffer) {
  // If configurations are missing, log a message and exit gracefully without throwing
  if (!metaHelpers.validateMetaConfig()) {
    console.warn(`[WhatsApp] Skipping notifications for order ${order.orderId}: Meta credentials (token, phone number ID, or owner number) are not configured.`);
    return;
  }

  // 1. Send text alert
  triggerWhatsAppMessageWithRetries(
    () => sendWhatsAppText(order),
    'WhatsAppText',
    order.orderId
  );

  // 2. Send PDF document
  triggerWhatsAppMessageWithRetries(
    () => sendWhatsAppPDF(order, pdfBuffer),
    'WhatsAppPDF',
    order.orderId
  );
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
  // 1. Upload PDF media to Meta
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

  // 2. Send the document using the media ID
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
 * @param {Function} sendFn Async function that performs the api call
 * @param {string} notificationType Enums from NotificationLog (WhatsAppText, WhatsAppPDF)
 * @param {string} orderId The associated Order ID
 * @param {number} attemptNumber Current attempt index (1-based)
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
