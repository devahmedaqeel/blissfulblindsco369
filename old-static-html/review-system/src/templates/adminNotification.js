const { wrapEmailLayout, escapeHtml, BRAND, PHONE_TEL } = require('./layout');

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

/**
 * Builds the internal admin notification email for any form submission
 * on the site (booking, chatbot lead, review, etc). Only ever includes
 * fields that were actually provided — never fabricates data.
 */
function adminNotificationEmail({
  sourceLabel,
  sourceEmoji = '🔔',
  name,
  phone,
  email,
  postcode,
  service,
  appointment,
  message,
  submittedAt,
  ip
}) {
  const subject = `${sourceEmoji} New ${sourceLabel} | Blissful Blinds Co`;

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
          <a href="${mailto}" style="display:inline-block; padding:12px 22px; border-radius:999px; background:linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accent}); background-color:${BRAND.accent}; color:#ffffff; font-size:13px; font-weight:700; text-decoration:none;">&#9993; Reply by Email</a>
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

module.exports = { adminNotificationEmail };
