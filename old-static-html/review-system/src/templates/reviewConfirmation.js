const { wrapEmailLayout, escapeHtml, BRAND, PHONE_DISPLAY, PHONE_TEL, EMAIL } = require('./layout');

/**
 * Customer-facing confirmation sent after a review submission. Distinct
 * from the general enquiry confirmation because a review isn't "we'll
 * call you back" — it's "thanks, it's awaiting moderation."
 */
function reviewConfirmationEmail({ name, rating }) {
  const subject = 'Thank You for Your Review — Blissful Blinds Co';
  const stars = '&#9733;'.repeat(Math.max(1, Math.min(5, Number(rating) || 5)));

  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td align="center">
          <div style="width:56px; height:56px; border-radius:50%; background-color:#dcfce7; display:inline-block; line-height:56px; text-align:center; font-size:26px;">&#9989;</div>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px; font-size:20px; font-weight:700; color:${BRAND.text}; text-align:center;">Thank You for Your Review</h1>
    <p style="margin:0 0 20px; font-size:20px; color:${BRAND.accent}; text-align:center; letter-spacing:2px;">${stars}</p>

    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Hello ${escapeHtml(name || 'there')},
    </p>
    <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      Thank you for taking the time to leave a review for Blissful Blinds Co 369. We've received it and it's now awaiting a quick check from our team before it goes live on the site.
    </p>
    <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">
      We really appreciate the feedback — it helps other homeowners choose with confidence.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg}; border-radius:10px;">
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
    previewText: 'Thanks for your review — it is awaiting a quick check before going live.',
    bodyHtml
  });

  const text = [
    `Hello ${name || 'there'},`,
    '',
    'Thank you for taking the time to leave a review for Blissful Blinds Co 369.',
    "We've received it and it's now awaiting a quick check from our team before it goes live on the site.",
    '',
    `Phone: ${PHONE_DISPLAY}`,
    `Email: ${EMAIL}`,
    '',
    'Thank you.',
    'Blissful Blinds Co'
  ].join('\n');

  return { subject, html, text };
}

module.exports = { reviewConfirmationEmail };
