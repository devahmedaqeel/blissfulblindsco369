/*
 * Shared HTML email layout + the two templates used by /api/notify.
 * Table-based, every style inline, no external CSS — Outlook desktop
 * renders email with Word's engine (no flexbox/grid support at all),
 * and Gmail strips <style> blocks in some contexts, so inline styles +
 * tables are the only layout approach that reliably survives across
 * Gmail, Outlook, Apple Mail, and Yahoo. Branding (colors, logo, footer)
 * mirrors the live site so these read as unmistakably the same brand.
 */

const BRAND = {
  navy: '#0f172a',
  navyLight: '#1c2c4c',
  accent: '#d97706',
  accentHover: '#b45309',
  accentLight: '#fef3c7',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  rowAlt: '#f8fafc',
  white: '#ffffff'
};

const SITE_URL = 'https://blissfulblindsco369.vercel.app';
const PHONE_DISPLAY = '07341 645339';
const PHONE_TEL = '+447341645339';
const EMAIL = 'blissfulblindsco369@gmail.com';
const BUSINESS_ADDRESS = '75 Ringwood Bretton, Peterborough, PE3 9SR, United Kingdom';
const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=+447341645339';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Shared chrome (header + footer) every email is wrapped in. Table-based,
 * fixed 600px card that shrinks to the viewport on small screens — the
 * standard responsive-email pattern, since real CSS media queries inside
 * <style> are stripped by several major clients (notably Gmail's app).
 */
function wrapEmailLayout({ title, previewText, bodyHtml }) {
  const year = new Date().getFullYear();
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

          <!-- Header: navy background, brand wordmark + subtitle, orange accent line — matches the site's top header exactly.
               Text-based wordmark rather than an <img> logo: it's a guaranteed-render, zero-network-request match for the
               site header's own brand-name/brand-tagline typography, with no risk of a blocked/broken remote image. -->
          <tr>
            <td style="background-color:${BRAND.navy}; background:linear-gradient(120deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 50%, ${BRAND.navy} 100%); padding:30px 32px 26px;" align="center">
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:24px; font-weight:800; letter-spacing:0.02em; color:${BRAND.white};">
                Blissful Blinds
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:${BRAND.accent}; margin:2px 0 12px;">
                Co. 369
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.55);">
                Professional Window Blinds Specialists
              </div>
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

          <!-- Footer: same brand chrome as the site footer — business details, WhatsApp/website links, copyright, automated-email disclaimer. -->
          <tr>
            <td style="background-color:${BRAND.navy}; padding:28px 32px; font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:${BRAND.white}; font-size:14px; font-weight:700; padding-bottom:6px;">
                    Blissful Blinds Co 369
                  </td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.65); font-size:12px; line-height:1.7; padding-bottom:16px;">
                    ${BUSINESS_ADDRESS}<br>
                    &#128222; <a href="tel:${PHONE_TEL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${PHONE_DISPLAY}</a>
                    &nbsp;&middot;&nbsp;
                    &#9993; <a href="mailto:${EMAIL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${EMAIL}</a>
                    &nbsp;&middot;&nbsp;
                    <a href="${SITE_URL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">blissfulblindsco369.com</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <a href="${WHATSAPP_URL}" style="display:inline-block; padding:7px 16px; border-radius:999px; background-color:#25d366; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">&#128172; WhatsApp Us</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.12); padding-top:14px; color:rgba(255,255,255,0.45); font-size:11px; line-height:1.6;">
                    &copy; ${year} Blissful Blinds Co 369. All rights reserved.<br>
                    This is an automated notification generated by the Blissful Blinds Co website.
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

/** One label/value row in the customer-details table, with alternating
 *  row shading (set inline per-row rather than via CSS, since Outlook
 *  desktop ignores :nth-child entirely). Skips rendering when the value
 *  is empty, so fields that don't apply to a given form (e.g. the
 *  chatbot lead form has no "address" field) simply don't appear. */
function detailRow(label, value, index) {
  if (!value) return '';
  const bg = index % 2 === 0 ? BRAND.white : BRAND.rowAlt;
  return `
    <tr>
      <td style="background-color:${bg}; padding:13px 18px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; color:${BRAND.textMuted}; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; vertical-align:top; width:170px; border-bottom:1px solid ${BRAND.border};">
        ${escapeHtml(label)}
      </td>
      <td style="background-color:${bg}; padding:13px 18px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:${BRAND.text}; border-bottom:1px solid ${BRAND.border};">
        ${escapeHtml(value)}
      </td>
    </tr>`;
}

/** One large pill action button, in the site's gradient CTA style. */
function actionButton(href, label, variant) {
  const styles = {
    dark: `background-color:${BRAND.navy}; background:linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight});`,
    accent: `background-color:${BRAND.accent}; background:linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accentHover});`,
    outline: `background-color:${BRAND.white}; border:2px solid ${BRAND.accent}; color:${BRAND.accent} !important;`
  };
  const color = variant === 'outline' ? BRAND.accent : '#ffffff';
  return `
    <td style="padding:0 6px 12px 0;">
      <a href="${href}" style="display:inline-block; padding:13px 22px; border-radius:999px; ${styles[variant]} color:${color}; font-family:Arial,Helvetica,sans-serif; font-size:13px; font-weight:700; text-decoration:none; white-space:nowrap;">${label}</a>
    </td>`;
}

/** Internal admin notification email for a form submission (booking or chatbot lead). */
function adminNotificationEmail({ source, sourceLabel, name, phone, email, address, postcode, service, appointment, hearAboutUs, message, submittedAt }) {
  const isBooking = source === 'booking';
  const badgeText = `${sourceLabel} Received`.toUpperCase();
  const heading = isBooking ? 'New Customer Booking Enquiry' : `New Customer ${sourceLabel}`;

  const subject = `🔔 New ${sourceLabel} | Blissful Blinds Co`;
  const tel = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
  const mailto = email ? `mailto:${email}` : null;
  const fullAddress = [address, postcode].filter(Boolean).join(', ');
  const mapsUrl = fullAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}` : null;

  let i = 0;
  const rows = [
    detailRow('Customer Name', name, i++),
    detailRow('Phone Number', phone, i++),
    detailRow('Email Address', email, i++),
    detailRow('Home Address', address, i++),
    detailRow('Postcode', postcode, i++),
    detailRow('Type of Blinds', service, i++),
    detailRow('Best Time To Call', appointment, i++),
    detailRow('How Did You Hear About Us', hearAboutUs, i++),
    detailRow('Customer Message', message, i++),
    detailRow('Submitted Date & Time', submittedAt, i++),
    detailRow('Source Form', sourceLabel, i++)
  ].join('');

  const buttons = [
    tel ? actionButton(tel, '&#128222; Call Customer', 'dark') : '',
    mailto ? actionButton(mailto, '&#9993; Reply by Email', 'accent') : '',
    mapsUrl ? actionButton(mapsUrl, '&#128205; View Address on Maps', 'outline') : ''
  ].join('');

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
      <tr>
        <td align="center">
          <span style="display:inline-block; padding:6px 16px; border-radius:999px; background-color:${BRAND.accentLight}; color:#92400e; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">
            ${escapeHtml(badgeText)}
          </span>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px; font-family:Arial,Helvetica,sans-serif; font-size:21px; font-weight:800; color:${BRAND.text}; text-align:center;">${escapeHtml(heading)}</h1>
    <p style="margin:0 0 26px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:${BRAND.textSecondary}; text-align:center;">A customer just submitted this on the website. Full details are below.</p>

    <!-- Rounded, bordered card wrapping the details table — same "rounded card" language as the site. -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border}; border-radius:14px; overflow:hidden; margin-bottom:26px;">
      ${rows}
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        ${buttons}
      </tr>
    </table>
  `;

  const html = wrapEmailLayout({
    title: subject,
    previewText: `New ${sourceLabel.toLowerCase()} from ${name || 'a customer'} — ${message ? message.slice(0, 80) : ''}`,
    bodyHtml
  });

  const text = [
    `${heading} — Blissful Blinds Co`,
    '',
    name ? `Customer Name: ${name}` : null,
    phone ? `Phone Number: ${phone}` : null,
    email ? `Email Address: ${email}` : null,
    address ? `Home Address: ${address}` : null,
    postcode ? `Postcode: ${postcode}` : null,
    service ? `Type of Blinds: ${service}` : null,
    appointment ? `Best Time To Call: ${appointment}` : null,
    hearAboutUs ? `How Did You Hear About Us: ${hearAboutUs}` : null,
    message ? `Customer Message: ${message}` : null,
    submittedAt ? `Submitted Date & Time: ${submittedAt}` : null,
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
