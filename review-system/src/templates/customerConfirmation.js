const { wrapEmailLayout, escapeHtml, BRAND, PHONE_DISPLAY, PHONE_TEL, EMAIL } = require('./layout');

/**
 * Customer-facing confirmation email, sent automatically after any form
 * submission (booking, chatbot lead). Copy matches the business's exact
 * requested wording.
 */
function customerConfirmationEmail({ name }) {
  const subject = 'Thank You for Contacting Blissful Blinds';
  const firstName = (name || '').trim().split(/\s+/)[0] || 'there';

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <div style="width:56px; height:56px; border-radius:50%; background-color:#dcfce7; display:inline-block; line-height:56px; text-align:center; font-size:26px;">&#9989;</div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:${BRAND.text}; text-align:center;">Thank You for Contacting Blissful Blinds</h1>

    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Hello ${escapeHtml(name || firstName)},
    </p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Thank you for contacting Blissful Blinds. We have successfully received your enquiry.
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
      <strong style="color:${BRAND.text};">Blissful Blinds</strong>
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
    'Thank you for contacting Blissful Blinds.',
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
    'Blissful Blinds'
  ].join('\n');

  return { subject, html, text };
}

module.exports = { customerConfirmationEmail };
