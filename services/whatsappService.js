const axios = require('axios');
const config = require('../config/config');
const NotificationLog = require('../models/NotificationLog');

/**
 * WhatsApp Service
 * Integrates with Meta WhatsApp Business Cloud API.
 * Handles text notifications, media uploads, and document sends with robust retries.
 */

// Delays in seconds for retries (Index 0 = 5s, Index 1 = 15s, Index 2 = 30s)
const RETRY_DELAYS = [5, 15, 30];

/**
 * Orchestrates sending both WhatsApp Text alert and WhatsApp PDF document to the owner.
 * Executes first attempts immediately (async/non-blocking for fast customer response).
 * @param {Object} order The Order object
 * @param {Buffer} pdfBuffer The invoice PDF buffer
 */
async function sendWhatsAppNotifications(order, pdfBuffer) {
  // Start the text message delivery
  triggerWhatsAppMessageWithRetries(
    () => sendWhatsAppText(order),
    'WhatsAppText',
    order.orderId
  );

  // Start the PDF document delivery (upload + send)
  triggerWhatsAppMessageWithRetries(
    () => sendWhatsAppPDF(order, pdfBuffer),
    'WhatsAppPDF',
    order.orderId
  );
}

/**
 * Formats the Meta WhatsApp Endpoint URL.
 */
function getMetaUrl(path = 'messages') {
  return `https://graph.facebook.com/v18.0/${config.whatsappPhoneNumberId}/${path}`;
}

/**
 * Formats the headers for Meta Cloud API request.
 */
function getMetaHeaders(contentType = 'application/json') {
  return {
    'Authorization': `Bearer ${config.whatsappAccessToken}`,
    'Content-Type': contentType
  };
}

/**
 * Formats order detail info into WhatsApp Text template format.
 */
function formatWhatsAppTextBody(order) {
  const formattedDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  
  const timeSubmitted = new Date(order.createdAt || Date.now()).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `🚨 *NEW ORDER RECEIVED*

*Order ID:*
${order.orderId}

*Customer:*
${order.customer.name}

*Phone:*
${order.customer.phone}

*Email:*
${order.customer.email}

*Product:*
${order.product.name}

*Colour:*
${order.product.colour}

*Width:*
${order.product.width} cm

*Height:*
${order.product.height} cm

*Quantity:*
${order.product.quantity}

*Installation:*
${order.product.installationRequired ? 'Yes' : 'No'}

*Address:*
${order.customer.address}, ${order.customer.city}, ${order.customer.postcode}

*Total:*
£${order.pricing.grandTotal.toFixed(2)}

*Preferred Installation:*
${formattedDate} (${order.scheduling.preferredTime})

*Time Submitted:*
${timeSubmitted}

*Open Dashboard:*
https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}`;
}

/**
 * Posts text message to Meta API.
 */
async function sendWhatsAppText(order) {
  if (!config.whatsappAccessToken || !config.whatsappPhoneNumberId || !config.ownerWhatsappNumber) {
    throw new Error('Meta WhatsApp configurations are incomplete (check access token, ID, or number).');
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: config.ownerWhatsappNumber,
    type: 'text',
    text: {
      preview_url: false,
      body: formatWhatsAppTextBody(order)
    }
  };

  const response = await axios.post(getMetaUrl('messages'), payload, {
    headers: getMetaHeaders()
  });

  return response.data;
}

/**
 * Uploads invoice PDF to Meta and sends it to the owner as a document.
 */
async function sendWhatsAppPDF(order, pdfBuffer) {
  if (!config.whatsappAccessToken || !config.whatsappPhoneNumberId || !config.ownerWhatsappNumber) {
    throw new Error('Meta WhatsApp configurations are incomplete.');
  }

  // 1. Upload PDF media to Meta
  const form = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  form.append('file', blob, `Order-${order.orderId}.pdf`);
  form.append('messaging_product', 'whatsapp');

  const uploadResponse = await axios.post(getMetaUrl('media'), form, {
    headers: getMetaHeaders('multipart/form-data')
  });

  const mediaId = uploadResponse.data.id;
  if (!mediaId) {
    throw new Error('Meta Media API upload succeeded but returned no media ID.');
  }

  // 2. Send the document using the media ID
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: config.ownerWhatsappNumber,
    type: 'document',
    document: {
      id: mediaId,
      filename: `Order-${order.orderId}.pdf`
    }
  };

  const sendResponse = await axios.post(getMetaUrl('messages'), payload, {
    headers: getMetaHeaders()
  });

  return sendResponse.data;
}

/**
 * Executes a sending function with a robust database logging and setTimeout retry mechanism.
 * @param {Function} sendFn Async function that performs the api call
 * @param {string} notificationType Enums from NotificationLog (WhatsAppText, WhatsAppPDF)
 * @param {string} orderId The associated Order ID
 * @param {number} attemptNumber Current attempt index (1-based)
 */
async function triggerWhatsAppMessageWithRetries(sendFn, notificationType, orderId, attemptNumber = 1) {
  try {
    // 1. Execute API call
    await sendFn();

    // 2. Log attempt Success in MongoDB
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

    // 3. Retry logic
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
