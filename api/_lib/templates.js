/*
 * Shared HTML email layout + the two templates used by /api/notify.
 * Table-based, every style inline, no external CSS — Outlook desktop
 * renders email with Word's engine (no flexbox/grid support at all),
 * and Gmail strips <style> blocks in some contexts, so inline styles +
 * tables are the only layout approach that reliably survives across
 * Gmail, Outlook, Apple Mail, and Yahoo.
 */

const BRAND = {
  navy: '#0f172a',
  accent: '#d97706',
  accentLight: '#fef3c7',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff'
};

const SITE_URL = 'https://blissfulblindsco369.vercel.app';
const PHONE_DISPLAY = '07341 645339';
const PHONE_TEL = '+447341645339';
const EMAIL = 'blissfulblindsco369@gmail.com';
const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=+447341645339';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function wrapEmailLayout({ title, previewText, bodyHtml }) {
  return `<!doctype html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(title)}</title>
<!--[if mso]>
<style type="text/css">
  table, td { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${escapeHtml(previewText || '')}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:${BRAND.white}; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(15,23,42,0.08);">

          <tr>
            <td style="background-color:${BRAND.navy}; padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif; color:${BRAND.white};">
                    <span style="font-size:20px; font-weight:700; letter-spacing:0.02em;">Blissful Blinds Co</span><br>
                    <span style="font-size:11px; font-weight:600; letter-spacing:0.14em; text-transform:uppercase; color:${BRAND.accent};">369</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.accent}; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <tr>
            <td style="padding:32px; font-family:Arial,Helvetica,sans-serif; color:${BRAND.text};">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="background-color:${BRAND.navy}; padding:28px 32px; font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:${BRAND.white}; font-size:14px; font-weight:700; padding-bottom:6px;">
                    Blissful Blinds Co 369
                  </td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.65); font-size:12px; line-height:1.7; padding-bottom:14px;">
                    75 Ringwood Bretton, Peterborough, PE3 9SR, United Kingdom<br>
                    &#128222; <a href="tel:${PHONE_TEL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${PHONE_DISPLAY}</a>
                    &nbsp;&middot;&nbsp;
                    &#9993; <a href="mailto:${EMAIL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${EMAIL}</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${WHATSAPP_URL}" style="display:inline-block; margin-right:10px; padding:6px 14px; border-radius:999px; background-color:#25d366; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">WhatsApp</a>
                    <a href="${SITE_URL}" style="display:inline-block; padding:6px 14px; border-radius:999px; background-color:rgba(255,255,255,0.12); color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">Website</a>
                  </td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.4); font-size:10px; padding-top:16px;">
                    This is an automated message from blissfulblindsco369.com. Please do not reply directly to this address unless invited to.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label, value) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:10px 14px; border-bottom:1px solid ${BRAND.border}; font-size:12px; font-weight:700; color:${BRAND.textSecondary}; text-transform:uppercase; letter-spacing:0.04em; white-space:nowrap; vertical-align:top; width:150px;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:10px 14px; border-bottom:1px solid ${BRAND.border}; font-size:14px; color:${BRAND.text};">
        ${escapeHtml(value)}
      </td>
    </tr>`;
}

/** Internal admin notification email for a form submission (booking or chatbot lead). */
function adminNotificationEmail({ sourceLabel, name, phone, email, postcode, service, appointment, message, submittedAt, ip }) {
  const subject = `🔔 New ${sourceLabel} | Blissful Blinds Co`;
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
  const mailto = email ? `mailto:${email}` : null;

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td>
          <span style="display:inline-block; padding:5px 12px; border-radius:999px; background-color:${BRAND.accentLight}; color:#92400e; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em;">
            ${escapeHtml(sourceLabel)}
          </span>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px; font-size:20px; font-weight:700; color:${BRAND.text};">New enquiry received</h1>
    <p style="margin:0 0 24px; font-size:14px; color:${BRAND.textSecondary};">A customer just submitted the ${escapeHtml(sourceLabel.toLowerCase())} on the website. Details below.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border}; border-radius:10px; overflow:hidden; margin-bottom:24px;">
      ${row('Customer Name', name)}
      ${row('Phone Number', phone)}
      ${row('Email Address', email)}
      ${row('Postcode', postcode)}
      ${row('Service Requested', service)}
      ${row('Preferred Appointment', appointment)}
      ${row('Customer Message', message)}
      ${row('Submitted', submittedAt)}
      ${row('Source Form', sourceLabel)}
      ${row('IP Address', ip)}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        ${tel ? `<td style="padding-right:10px;">
          <a href="${tel}" style="display:inline-block; padding:12px 22px; border-radius:999px; background-color:${BRAND.navy}; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none;">&#128222; Call Customer</a>
        </td>` : ''}
        ${mailto ? `<td>
          <a href="${mailto}" style="display:inline-block; padding:12px 22px; border-radius:999px; background-color:${BRAND.accent}; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none;">&#9993; Reply by Email</a>
        </td>` : ''}
      </tr>
    </table>
  `;

  const html = wrapEmailLayout({
    title: subject,
    previewText: `New ${sourceLabel.toLowerCase()} from ${name || 'a customer'} — ${message ? message.slice(0, 80) : ''}`,
    bodyHtml
  });

  const text = [
    `New ${sourceLabel} — Blissful Blinds Co`,
    '',
    name ? `Customer Name: ${name}` : null,
    phone ? `Phone Number: ${phone}` : null,
    email ? `Email Address: ${email}` : null,
    postcode ? `Postcode: ${postcode}` : null,
    service ? `Service Requested: ${service}` : null,
    appointment ? `Preferred Appointment: ${appointment}` : null,
    message ? `Customer Message: ${message}` : null,
    submittedAt ? `Submitted: ${submittedAt}` : null,
    ip ? `IP Address: ${ip}` : null,
    `Source Form: ${sourceLabel}`
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

/** Customer-facing confirmation email, sent automatically after any form submission. */
function customerConfirmationEmail({ name }) {
  const subject = 'Thank You for Contacting Blissful Blinds Co';
  const firstName = (name || '').trim().split(/\s+/)[0] || 'there';

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <div style="width:56px; height:56px; border-radius:50%; background-color:#dcfce7; display:inline-block; line-height:56px; text-align:center; font-size:26px;">&#9989;</div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:${BRAND.text}; text-align:center;">Thank You for Contacting Blissful Blinds Co</h1>

    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Hello ${escapeHtml(name || firstName)},
    </p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Thank you for contacting Blissful Blinds Co. We have successfully received your enquiry.
    </p>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Our team will contact you as soon as possible. If your enquiry is urgent, please call us.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg}; border-radius:10px; margin-bottom:8px;">
      <tr>
        <td style="padding:20px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:${BRAND.textMuted}; padding-bottom:4px;">&#128222; Phone</td>
            </tr>
            <tr>
              <td style="padding-bottom:14px;"><a href="tel:${PHONE_TEL}" style="font-size:17px; font-weight:700; color:${BRAND.text}; text-decoration:none;">${PHONE_DISPLAY}</a></td>
            </tr>
            <tr>
              <td style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:${BRAND.textMuted}; padding-bottom:4px;">&#9993; Email</td>
            </tr>
            <tr>
              <td><a href="mailto:${EMAIL}" style="font-size:17px; font-weight:700; color:${BRAND.text}; text-decoration:none;">${EMAIL}</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Thank you.<br>
      <strong style="color:${BRAND.text};">Blissful Blinds Co</strong>
    </p>
  `;

  const html = wrapEmailLayout({
    title: subject,
    previewText: 'We have received your enquiry and will be in touch shortly.',
    bodyHtml
  });

  const text = [
    `Hello ${name || firstName},`,
    '',
    'Thank you for contacting Blissful Blinds Co.',
    '',
    'We have successfully received your enquiry.',
    '',
    'Our team will contact you as soon as possible.',
    '',
    'If your enquiry is urgent, please call us.',
    '',
    `Phone: ${PHONE_DISPLAY}`,
    `Email: ${EMAIL}`,
    '',
    'Thank you.',
    'Blissful Blinds Co'
  ].join('\n');

  return { subject, html, text };
}

module.exports = { adminNotificationEmail, customerConfirmationEmail };
