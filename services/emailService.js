const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create a cached transporter promise to avoid concurrent setup races
let transporterPromise = null;

function createTransporter() {
  if (config.emailUser && config.emailPass) {
    return nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort,
      secure: config.emailPort === 465, // true for port 465, false for other ports (like 587 using STARTTLS)
      auth: {
        user: config.emailUser,
        pass: config.emailPass
      },
      connectionTimeout: 10000,
      socketTimeout: 10000
    });
  } else {
    // Fallback to a console transport/warning if credentials aren't set
    console.warn('[email] Nodemailer credentials are missing. Emails will be logged to the console.');
    return {
      sendMail: async (mailOptions) => {
        console.log('--- MOCK EMAIL SEND ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Has PDF Attachment: ${!!mailOptions.attachments?.length}`);
        console.log('-----------------------');
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
  }
}

function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(createTransporter());
  }
  return transporterPromise;
}

/**
 * Sends a HTML email confirmation to the customer with their order summary.
 * @param {Object} order The Order object
 * @param {Buffer} pdfBuffer The generated PDF invoice buffer
 */
async function sendCustomerConfirmationEmail(order, pdfBuffer) {
  const transporter = await getTransporter();
  
  const formattedDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 20px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background-color: #0f172a; padding: 32px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .header p { color: #e11d48; margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; }
        .content { padding: 32px; }
        .thank-you { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; }
        .lead-time { background: #fff1f2; border-left: 4px solid #e11d48; padding: 16px; border-radius: 4px; margin: 24px 0; font-size: 14px; color: #9f1239; line-height: 1.5; }
        .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
        .summary-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0 0 12px 0; letter-spacing: 0.05em; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .details-list { list-style: none; padding: 0; margin: 0; font-size: 14px; }
        .details-list li { margin-bottom: 8px; line-height: 1.4; }
        .details-list strong { color: #475569; }
        .totals-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
        .totals-table td { padding: 6px 0; }
        .totals-table .label { color: #64748b; }
        .totals-table .value { text-align: right; font-weight: 600; }
        .totals-table .total-row td { border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 16px; font-weight: 700; color: #e11d48; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #64748b; }
        .footer a { color: #e11d48; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>Blissful Blinds Ltd</h1>
          <p>Made to Measure Window Coverings</p>
        </div>
        <div class="content">
          <p class="thank-you">Dear ${order.customer.name},</p>
          <p>Thank you for choosing Blissful Blinds Ltd. Your order has been successfully placed, and our team is ready to begin processing your custom-made coverings.</p>
          
          <div class="lead-time">
            <strong>Expected Response & Lead Time:</strong><br>
            A design advisor will verify your details within 24 hours. Your custom blinds will be manufactured in 7-14 working days, and we will contact you to confirm the installation slot.
          </div>

          <div class="summary-box">
            <h3 class="summary-title">Order Information</h3>
            <ul class="details-list">
              <li><strong>Order ID:</strong> ${order.orderId}</li>
              <li><strong>Product:</strong> ${order.product.name} (${order.product.blindType})</li>
              <li><strong>Specs:</strong> ${order.product.colour} Color, ${order.product.fabric} Fabric</li>
              <li><strong>Dimensions:</strong> ${order.product.width} W x ${order.product.height} H (cm)</li>
              <li><strong>Room & Fitting:</strong> ${order.product.room} - ${order.product.fittingType}</li>
              <li><strong>Preferred Date:</strong> ${formattedDate} (${order.scheduling.preferredTime})</li>
            </ul>

            <table class="totals-table">
              <tr>
                <td class="label">Subtotal</td>
                <td class="value">£${order.pricing.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">VAT (20%)</td>
                <td class="value">£${order.pricing.vat.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Grand Total</td>
                <td class="value">£${order.pricing.grandTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <p>We have attached your official Invoice PDF to this email for your records. Please review the details and contact us immediately if you require any adjustments.</p>
          
          <p>Warm regards,<br><strong>The Blissful Blinds Team</strong></p>
        </div>
        <div class="footer">
          Blissful Blinds Ltd | 75 Ringwood Bretton, Peterborough, PE3 9SR<br>
          Company No: 17329706 | Phone: <a href="tel:01733853037">01733 853037</a> | WhatsApp: <a href="https://wa.me/447341645339">+44 7341 645339</a><br>
          Website: <a href="https://blissfulblindsltd.co.uk">blissfulblindsltd.co.uk</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `Blissful Blinds Ltd <${config.emailUser || 'no-reply@blissfulblindsltd.co.uk'}>`,
    to: order.customer.email,
    subject: 'Thank you for your Order - Blissful Blinds Ltd',
    html: html,
    text: `Thank you for your order, ${order.customer.name}! Order ID: ${order.orderId}. Your order total is £${order.pricing.grandTotal.toFixed(2)}. We have attached your invoice PDF. Expected manufacturing time is 7-14 working days.`,
    attachments: [
      {
        filename: `Order-${order.orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}

/**
 * Sends a HTML alert email to the business owner containing every detail.
 * @param {Object} order The Order object
 * @param {Buffer} pdfBuffer The generated PDF invoice buffer
 * @param {string} googleMapsLink The generated Google Maps URL
 */
async function sendOwnerAlertEmail(order, pdfBuffer, googleMapsLink) {
  const transporter = await getTransporter();

  const formattedDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 20px; }
        .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; }
        .alert-bar { background-color: #e11d48; color: #ffffff; padding: 20px; text-align: center; }
        .alert-bar h2 { margin: 0; font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
        .details-section { padding: 30px; }
        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin: 24px 0 12px 0; }
        .details-grid { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        .details-grid td { padding: 8px 0; border-bottom: 1px dashed #f1f5f9; font-size: 14px; vertical-align: top; }
        .details-grid td.label { font-weight: bold; color: #475569; width: 180px; }
        .details-grid td.value { color: #0f172a; }
        .btn { display: inline-block; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin-right: 12px; margin-top: 10px; }
        .btn-maps { background-color: #0f172a; color: #ffffff !important; }
        .btn-dashboard { background-color: #e11d48; color: #ffffff !important; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert-bar">
          <h2>🚨 NEW ORDER RECEIVED</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px;">Order ID: ${order.orderId}</p>
        </div>
        <div class="details-section">
          <p>A new order has been submitted online. The customer details and ordered products are provided below. A PDF copy of the invoice is attached to this email.</p>

          <div class="section-title">Customer Contact Details</div>
          <table class="details-grid">
            <tr>
              <td class="label">Customer Name</td>
              <td class="value">${order.customer.name}</td>
            </tr>
            <tr>
              <td class="label">Company Name</td>
              <td class="value">${order.customer.companyName || 'None'}</td>
            </tr>
            <tr>
              <td class="label">Email Address</td>
              <td class="value"><a href="mailto:${order.customer.email}">${order.customer.email}</a></td>
            </tr>
            <tr>
              <td class="label">Phone Number</td>
              <td class="value"><a href="tel:${order.customer.phone}">${order.customer.phone}</a></td>
            </tr>
            <tr>
              <td class="label">WhatsApp Number</td>
              <td class="value"><a href="https://wa.me/${order.customer.whatsappNumber.replace(/[^\d]/g, '')}">${order.customer.whatsappNumber}</a></td>
            </tr>
            <tr>
              <td class="label">Installation Address</td>
              <td class="value">${order.customer.address}</td>
            </tr>
            <tr>
              <td class="label">City & Postcode</td>
              <td class="value">${order.customer.city}, ${order.customer.postcode}</td>
            </tr>
          </table>

          <div class="section-title">Product Customization</div>
          <table class="details-grid">
            <tr>
              <td class="label">Product Name</td>
              <td class="value"><strong>${order.product.name}</strong></td>
            </tr>
            <tr>
              <td class="label">Blind Type</td>
              <td class="value">${order.product.blindType}</td>
            </tr>
            <tr>
              <td class="label">Colour</td>
              <td class="value">${order.product.colour}</td>
            </tr>
            <tr>
              <td class="label">Fabric/Material</td>
              <td class="value">${order.product.fabric}</td>
            </tr>
            <tr>
              <td class="label">Dimensions (W x H)</td>
              <td class="value">${order.product.width} cm x ${order.product.height} cm</td>
            </tr>
            <tr>
              <td class="label">Fitting Details</td>
              <td class="value">${order.product.fittingType} (${order.product.installationRequired ? 'Installation Required' : 'Supply Only'})</td>
            </tr>
            <tr>
              <td class="label">Room Location</td>
              <td class="value">${order.product.room}</td>
            </tr>
            <tr>
              <td class="label">Ordered Quantity</td>
              <td class="value">${order.product.quantity}</td>
            </tr>
          </table>

          <div class="section-title">Scheduling & Pricing</div>
          <table class="details-grid">
            <tr>
              <td class="label">Preferred Date</td>
              <td class="value">${formattedDate}</td>
            </tr>
            <tr>
              <td class="label">Preferred Time Slot</td>
              <td class="value">${order.scheduling.preferredTime}</td>
            </tr>
            <tr>
              <td class="label">Special Notes</td>
              <td class="value">${order.scheduling.specialNotes || 'None'}</td>
            </tr>
            <tr>
              <td class="label">Subtotal</td>
              <td class="value">£${order.pricing.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">VAT (20%)</td>
              <td class="value">£${order.pricing.vat.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label" style="color: #e11d48;">Grand Total</td>
              <td class="value" style="color: #e11d48; font-weight: bold; font-size: 16px;">£${order.pricing.grandTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Customer IP / Browser</td>
              <td class="value" style="font-size: 12px; color: #64748b;">IP: ${order.metadata.ipAddress}<br>Browser: ${order.metadata.browser}</td>
            </tr>
          </table>

          <div class="section-title">Administrative Actions</div>
          <p>Use the links below to route the address or manage this order in real time.</p>
          <a href="${googleMapsLink}" target="_blank" class="btn btn-maps">📍 Route Google Maps</a>
          <a href="https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}" target="_blank" class="btn btn-dashboard">⚙ Open Dashboard</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `Blissful Blinds Notifications <${config.emailUser || 'no-reply@blissfulblindsltd.co.uk'}>`,
    to: config.ownerEmail,
    subject: `🚨 NEW ORDER RECEIVED - Order ID: ${order.orderId}`,
    html: html,
    text: `New order alert! Order ID: ${order.orderId}. Customer: ${order.customer.name}. Product: ${order.product.name}. Total: £${order.pricing.grandTotal.toFixed(2)}. Open dashboard: https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}`,
    replyTo: order.customer.email,
    attachments: [
      {
        filename: `Order-${order.orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}

module.exports = {
  sendCustomerConfirmationEmail,
  sendOwnerAlertEmail
};
