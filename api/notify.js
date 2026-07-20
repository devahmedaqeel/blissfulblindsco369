// POST /api/notify — upgraded form-submission endpoint
// Generates a unique ID in format ORD-YYYY-XXXX, compiles a PDF using pdf-lib,
// uploads it to a private Supabase bucket, sends an email (with PDF attachment),
// and dispatches a CallMeBot WhatsApp text alert (with a signed PDF link) to the owner.
const { validateLeadSubmission } = require('./_lib/validateLead');
const { sendMail, MAIL_TO } = require('./_lib/mailer');
const { adminNotificationEmail, customerConfirmationEmail } = require('./_lib/templates');
const { isRateLimited } = require('./_lib/rateLimit');
const { recordEnquiry } = require('./_lib/enquiry');
const { createClient } = require('@supabase/supabase-js');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || 'unknown';
}

function formatSubmittedAt(date) {
  return date.toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London'
  });
}

function generateOrderId() {
  const currentYear = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${currentYear}-${randomStr}`;
}

async function generatePdfLibBuffer({ orderId, name, phone, email, message, submittedAt, service, preferredColor, appointment, address, postcode }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Header Accent Stripe
  page.drawRectangle({
    x: 0,
    y: height - 12,
    width: width,
    height: 12,
    color: rgb(15/255, 23/255, 42/255)
  });
  
  page.drawText('Blissful Blinds Ltd', { x: 40, y: height - 60, size: 22, font: helveticaBold, color: rgb(15/255, 23/255, 42/255) });
  page.drawText('STYLE • PRIVACY • COMFORT', { x: 40, y: height - 76, size: 10, font: helveticaBold, color: rgb(200/255, 16/255, 46/255) });
  
  page.drawText('BOOKING SHEET', { x: width - 200, y: height - 60, size: 14, font: helveticaBold, color: rgb(15/255, 23/255, 42/255) });
  page.drawText(`Order ID: ${orderId}`, { x: width - 200, y: height - 76, size: 10, font: helvetica, color: rgb(100/255, 116/255, 139/255) });
  page.drawText(`Date: ${submittedAt}`, { x: width - 200, y: height - 92, size: 10, font: helvetica, color: rgb(100/255, 116/255, 139/255) });
  
  page.drawLine({
    start: { x: 40, y: height - 110 },
    end: { x: width - 40, y: height - 110 },
    thickness: 1.5,
    color: rgb(226/255, 232/255, 240/255)
  });

  // Section 1: Customer Contact
  page.drawText('Customer Contact Details', { x: 40, y: height - 135, size: 12, font: helveticaBold, color: rgb(200/255, 16/255, 46/255) });
  page.drawRectangle({ x: 40, y: height - 225, width: width - 80, height: 75, color: rgb(248/255, 250/255, 252/255), borderColor: rgb(226/255, 232/255, 240/255), borderWidth: 1 });
  
  page.drawText('Name:', { x: 55, y: height - 170, size: 10, font: helveticaBold });
  page.drawText(name || 'N/A', { x: 170, y: height - 170, size: 10, font: helvetica });
  
  page.drawText('Phone:', { x: 55, y: height - 190, size: 10, font: helveticaBold });
  page.drawText(phone || 'N/A', { x: 170, y: height - 190, size: 10, font: helvetica });
  
  page.drawText('Email:', { x: 55, y: height - 210, size: 10, font: helveticaBold });
  page.drawText(email || 'N/A', { x: 170, y: height - 210, size: 10, font: helvetica });

  // Section 2: Address
  page.drawText('Service Location', { x: 40, y: height - 255, size: 12, font: helveticaBold, color: rgb(200/255, 16/255, 46/255) });
  page.drawRectangle({ x: 40, y: height - 325, width: width - 80, height: 55, color: rgb(248/255, 250/255, 252/255), borderColor: rgb(226/255, 232/255, 240/255), borderWidth: 1 });
  
  page.drawText('Address:', { x: 55, y: height - 290, size: 10, font: helveticaBold });
  page.drawText(address || 'N/A', { x: 170, y: height - 290, size: 10, font: helvetica });
  
  page.drawText('Postcode:', { x: 55, y: height - 310, size: 10, font: helveticaBold });
  page.drawText(postcode || 'N/A', { x: 170, y: height - 310, size: 10, font: helvetica });

  // Section 3: Request Specifications
  page.drawText('Enquiry Specifications', { x: 40, y: height - 355, size: 12, font: helveticaBold, color: rgb(200/255, 16/255, 46/255) });
  page.drawRectangle({ x: 40, y: height - 425, width: width - 80, height: 55, color: rgb(248/255, 250/255, 252/255), borderColor: rgb(226/255, 232/255, 240/255), borderWidth: 1 });
  
  page.drawText('Type of Blinds:', { x: 55, y: height - 390, size: 10, font: helveticaBold });
  page.drawText(service || 'N/A', { x: 170, y: height - 390, size: 10, font: helvetica });
  
  page.drawText('Preferred Colour:', { x: 55, y: height - 410, size: 10, font: helveticaBold });
  page.drawText(preferredColor || 'N/A', { x: 170, y: height - 410, size: 10, font: helvetica });

  // Section 4: Message
  if (message) {
    page.drawText('Additional Message', { x: 40, y: height - 455, size: 12, font: helveticaBold, color: rgb(200/255, 16/255, 46/255) });
    page.drawRectangle({ x: 40, y: height - 545, width: width - 80, height: 75, color: rgb(254/255, 242/255, 242/255), borderColor: rgb(252/255, 165/255, 165/255), borderWidth: 1 });
    page.drawText(message, { x: 55, y: height - 485, size: 9, font: helvetica, color: rgb(15/255, 23/255, 42/255), maxWidth: width - 110, lineHeight: 14 });
  }

  // Footer
  page.drawLine({ start: { x: 40, y: 50 }, end: { x: width - 40, y: 50 }, thickness: 1, color: rgb(226/255, 232/255, 240/255) });
  page.drawText('Blissful Blinds Ltd • Registered in England & Wales • Company Number: 17329706', { x: 40, y: 35, size: 8, font: helvetica, color: rgb(148/255, 163/255, 184/255) });
  page.drawText('75 Ringwood, Bretton, Peterborough, PE3 9SR • info@blissfulblindsltd.co.uk', { x: 40, y: 22, size: 8, font: helvetica, color: rgb(148/255, 163/255, 184/255) });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length) {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body == null ? {} : null;
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed.' });
    }

    const ip = getClientIp(req);
    if (await isRateLimited(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const body = parseBody(req);
    if (body === null) {
      return res.status(400).json({ error: 'Malformed request body.' });
    }

    const result = validateLeadSubmission(body);
    if (!result.valid) {
      if (result.errors._spam) {
        return res.status(201).json({ message: 'Thank you! We will be in touch shortly.' });
      }
      return res.status(400).json({ error: 'Validation failed.', fields: result.errors });
    }

    const {
      source, sourceLabel, name, email, phone, address, postcode, service, preferredColor,
      appointmentDate, appointmentTime, hearAboutUs, message, pageUrl, referrer
    } = result.data;
    const submittedAtDisplay = formatSubmittedAt(new Date());
    const appointment = [appointmentDate, appointmentTime].filter(Boolean).join(' ');
    const userAgent = req.headers['user-agent'] || '';

    // 1. Generate Unique ID: ORD-YYYY-XXXX
    const orderId = generateOrderId();

    // 2. Generate PDF using pdf-lib (Pure JS memory buffer)
    let pdfBuffer = null;
    try {
      pdfBuffer = await generatePdfLibBuffer({
        orderId,
        name,
        phone,
        email,
        message,
        submittedAt: submittedAtDisplay,
        service,
        preferredColor,
        appointment,
        address,
        postcode
      });
    } catch (pdfErr) {
      console.error('[notify] PDF compilation error:', pdfErr);
    }

    // 3. Upload to a private Supabase bucket & get a time-limited signed URL.
    // The bucket stays private (never public) because the PDF contains the
    // client's name/phone/email/address — a public bucket would let anyone
    // who guesses/finds a filename open another client's data. A signed URL
    // grants time-boxed access to this one file only.
    let pdfLink = '';
    const SIGNED_URL_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseServiceKey && pdfBuffer) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error: uploadError } = await supabase.storage
          .from('orders')
          .upload(`${orderId}.pdf`, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('[notify] Supabase storage upload failed:', uploadError.message);
        } else {
          const { data: signedData, error: signError } = await supabase.storage
            .from('orders')
            .createSignedUrl(`${orderId}.pdf`, SIGNED_URL_TTL_SECONDS);

          if (signError) {
            console.error('[notify] Supabase signed URL creation failed:', signError.message);
          } else {
            pdfLink = signedData.signedUrl;
            console.log('[notify] Supabase upload succeeded. Signed URL (7-day):', pdfLink);
          }
        }
      } catch (sbErr) {
        console.error('[notify] Supabase client error:', sbErr.message);
      }
    } else {
      console.warn('[notify] Supabase credentials or PDF buffer missing — skipping upload.');
    }

    // 4. Send Nodemailer Emails (with PDF attachment + ID in body)
    let emailDelivered = false;
    try {
      const admin = adminNotificationEmail({
        source, sourceLabel, name, phone, email, address, postcode, service, preferredColor, appointment, hearAboutUs, message,
        submittedAt: `${submittedAtDisplay} (Order ID: ${orderId})`
      });
      const customer = customerConfirmationEmail({ name });

      const emailAttachments = pdfBuffer ? [{ filename: `${orderId}.pdf`, content: pdfBuffer }] : [];

      const [adminResult, customerResult] = await Promise.all([
        sendMail({
          to: MAIL_TO,
          subject: `${admin.subject} | ID: ${orderId}`,
          html: admin.html,
          text: admin.text,
          replyTo: email,
          attachments: emailAttachments
        }),
        sendMail({
          to: email,
          subject: `${customer.subject} | ID: ${orderId}`,
          html: customer.html,
          text: customer.text,
          attachments: emailAttachments
        })
      ]);

      emailDelivered = adminResult.success && customerResult.success;
    } catch (mailErr) {
      console.error('[notify] Nodemailer dispatch failed:', mailErr.message);
    }

    // 5. Send WhatsApp notification via CallMeBot (owner alert).
    // CallMeBot's free tier is text-only — it can't attach a file — so the
    // signed Supabase PDF link (from step 3) is appended to the message
    // instead of the PDF itself.
    const callMeBotApiKey = process.env.CALLMEBOT_API_KEY;
    const ownerWhatsappNumber = process.env.OWNER_WHATSAPP_NUMBER;

    if (callMeBotApiKey && ownerWhatsappNumber) {
      try {
        const formattedText = `🔔 *NEW BOOKING RECEIVED*
----------------------------------------
🆔 *Order ID:* ${orderId}
👤 *Name:* ${name || 'N/A'}
📞 *Phone:* ${phone || 'N/A'}
📧 *Email:* ${email || 'N/A'}
🏠 *Address:* ${address || 'N/A'}, ${postcode || ''}
🪟 *Blinds:* ${service || 'N/A'}
🎨 *Colour:* ${preferredColor || 'N/A'}
⏰ *Slot:* ${appointment || 'N/A'}
💬 *Message:* ${message || 'None'}
----------------------------------------
🕐 *Submitted:* ${submittedAtDisplay}
🌐 *Website:* https://blissfulblindsltd.co.uk${pdfLink ? `\n📥 *Invoice PDF (valid 7 days):* ${pdfLink}` : ''}`;

        // CallMeBot expects the recipient with a leading + and country code.
        const recipient = ownerWhatsappNumber.replace(/[^\d+]/g, '');
        const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(recipient)}&text=${encodeURIComponent(formattedText)}&apikey=${encodeURIComponent(callMeBotApiKey)}`;

        const cmbResponse = await fetch(callMeBotUrl);
        if (!cmbResponse.ok) {
          const errText = await cmbResponse.text().catch(() => '');
          console.error('[notify] CallMeBot dispatch failed status:', cmbResponse.status, errText.slice(0, 300));
        } else {
          console.log('[notify] CallMeBot WhatsApp alert dispatched.');
        }
      } catch (waErr) {
        console.error('[notify] CallMeBot process error:', waErr.message);
      }
    } else {
      console.warn('[notify] CallMeBot credentials missing — skipping WhatsApp alert.');
    }

    // 6. Record to DB (Supabase lead record fallback)
    try {
      await recordEnquiry({
        source, sourceLabel, name, email, phone, address, postcode, service, preferredColor,
        appointment, hearAboutUs, message, ip, userAgent, pageUrl, referrer,
        emailDelivered
      });
    } catch (dbErr) {
      console.error('[notify] Database record failed:', dbErr.message);
    }

    // 7. Safe return 201/200 code
    return res.status(201).json({
      message: 'Thank you! Your request has been received and our team will be in touch shortly.',
      orderId,
      emailDelivered
    });
  } catch (err) {
    console.error('[notify] Unhandled error in booking API endpoint:', err);
    return res.status(200).json({
      message: 'Thank you! Your request has been received and our team will be in touch shortly.'
    });
  }
};
