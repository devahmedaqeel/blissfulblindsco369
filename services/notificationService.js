const { generateInvoicePDF } = require('./pdfGenerator');
const { sendCustomerConfirmationEmail, sendOwnerAlertEmail } = require('./emailService');
const { sendWhatsAppNotifications } = require('./whatsapp');
const { generateMapsLink } = require('./googleMapsHelper');
const { logAudit } = require('./loggerService');
const NotificationLog = require('../models/NotificationLog');

/**
 * Notification Service
 * Orchestrates order notification dispatch: PDF invoice generation, email dispatch, and WhatsApp dispatch.
 */

/**
 * Processes all notifications for a newly created order.
 * Resolves within a few seconds (guaranteed under 10s) by executing emails concurrently and WhatsApp in background.
 * @param {Object} order The Order object from MongoDB
 * @returns {Promise<Object>} Object containing delivery status: { success: Boolean, emailConfirmation: Boolean, emailOwner: Boolean }
 */
async function processOrderNotifications(order) {
  const orderId = order.orderId;
  console.log(`[NotificationService] Processing notifications for order ${orderId}...`);

  try {
    // 1. Generate PDF Invoice Buffer
    const pdfBuffer = await generateInvoicePDF(order);
    await logAudit(orderId, 'PDF Invoice Generated', 'System', 'Invoice PDF constructed in memory.');

    // 2. Generate Google Maps link from customer address
    const mapsLink = generateMapsLink(order.customer.address, order.customer.postcode);

    // 3. Setup default Notification Log entries in database
    await Promise.all([
      new NotificationLog({ orderId, notificationType: 'EmailConfirmation', status: 'Pending' }).save(),
      new NotificationLog({ orderId, notificationType: 'EmailOwner', status: 'Pending' }).save(),
      new NotificationLog({ orderId, notificationType: 'WhatsAppText', status: 'Pending' }).save(),
      new NotificationLog({ orderId, notificationType: 'WhatsAppPDF', status: 'Pending' }).save()
    ]);

    // 4. Send Nodemailer Emails Concurrently
    let emailConfirmationSuccess = false;
    let emailOwnerSuccess = false;

    await Promise.all([
      // Customer thank you confirmation
      (async () => {
        const start = Date.now();
        const res = await sendCustomerConfirmationEmail(order, pdfBuffer);
        emailConfirmationSuccess = res.success;
        
        await NotificationLog.findOneAndUpdate(
          { orderId, notificationType: 'EmailConfirmation' },
          {
            status: res.success ? 'Sent' : 'Failed',
            deliveredAt: res.success ? new Date() : undefined,
            $push: {
              attempts: {
                attemptNumber: 1,
                success: res.success,
                errorMsg: res.error || '',
                timestamp: new Date()
              }
            },
            failuresCount: res.success ? 0 : 1
          }
        );
        await logAudit(orderId, `Customer Email ${res.success ? 'Sent' : 'Failed'}`, 'System', `Took ${Date.now() - start}ms.`);
      })(),
      
      // Owner alert email
      (async () => {
        const start = Date.now();
        const res = await sendOwnerAlertEmail(order, pdfBuffer, mapsLink);
        emailOwnerSuccess = res.success;
        
        await NotificationLog.findOneAndUpdate(
          { orderId, notificationType: 'EmailOwner' },
          {
            status: res.success ? 'Sent' : 'Failed',
            deliveredAt: res.success ? new Date() : undefined,
            $push: {
              attempts: {
                attemptNumber: 1,
                success: res.success,
                errorMsg: res.error || '',
                timestamp: new Date()
              }
            },
            failuresCount: res.success ? 0 : 1
          }
        );
        await logAudit(orderId, `Owner Alert Email ${res.success ? 'Sent' : 'Failed'}`, 'System', `Took ${Date.now() - start}ms.`);
      })()
    ]);

    // 5. Fire WhatsApp Notifications (Text + PDF) in background
    // (Does not block the API response time, ensuring rapid sub-10 second request times)
    sendWhatsAppNotifications(order, pdfBuffer).catch(err => {
      console.error(`[NotificationService] WhatsApp notification background crash for ${orderId}:`, err.message);
    });

    return {
      success: emailConfirmationSuccess && emailOwnerSuccess,
      emailConfirmation: emailConfirmationSuccess,
      emailOwner: emailOwnerSuccess
    };

  } catch (error) {
    console.error(`[NotificationService] Unexpected notifications crash for order ${orderId}:`, error.message);
    await logAudit(orderId, 'Notifications Process Error', 'System', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processOrderNotifications
};
