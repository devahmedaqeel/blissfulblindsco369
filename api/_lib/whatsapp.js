/**
 * WhatsApp notification helper for the existing booking/chatbot lead flow.
 * Sends a formatted text message to the business owner's WhatsApp when a
 * new enquiry arrives — alongside the existing admin email.
 *
 * Uses the Meta WhatsApp Business Cloud API. If the required env vars
 * (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) are not set, the
 * function silently skips — the existing email flow is never blocked.
 */

const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER || '+447341645339';
const ACCESS_TOKEN   = process.env.WHATSAPP_ACCESS_TOKEN  || '';
const PHONE_ID       = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

/**
 * Build a clean, readable WhatsApp text message from the lead data.
 */
function formatLeadMessage({ sourceLabel, name, phone, email, address, postcode, service, preferredColor, appointment, message, submittedAt }) {
  const lines = [
    `🔔 *New ${sourceLabel || 'Enquiry'} — Blissful Blinds*`,
    '',
    `👤 *Name:* ${name || 'N/A'}`,
    phone   ? `📞 *Phone:* ${phone}` : null,
    email   ? `📧 *Email:* ${email}` : null,
    address ? `🏠 *Address:* ${address}` : null,
    postcode ? `📍 *Postcode:* ${postcode}` : null,
    service ? `🪟 *Blinds Type:* ${service}` : null,
    preferredColor ? `🎨 *Colour:* ${preferredColor}` : null,
    appointment ? `⏰ *Preferred Time:* ${appointment}` : null,
    message ? `💬 *Message:* ${message}` : null,
    '',
    `🕐 *Submitted:* ${submittedAt || new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`,
    '',
    '— _Blissful Blinds Automated Alert_'
  ];
  return lines.filter(l => l !== null).join('\n');
}

/**
 * Send a WhatsApp text message to the owner via Meta Cloud API.
 * Returns { success, error? }. Never throws — the caller's email
 * flow must never be disrupted by a WhatsApp failure.
 */
async function sendWhatsAppLead(leadData) {
  // If Meta API credentials are not configured, skip silently.
  if (!ACCESS_TOKEN || !PHONE_ID || ACCESS_TOKEN === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[whatsapp] Meta API credentials not configured — skipping WhatsApp notification.');
    return { success: false, error: 'Not configured' };
  }

  const text = formatLeadMessage(leadData);

  // Strip the leading '+' for the API (Meta expects numeric-only recipient)
  const recipient = OWNER_WHATSAPP.replace(/[^\d]/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'text',
    text: { body: text }
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[whatsapp] Meta API error ${response.status}:`, errBody);
      return { success: false, error: `API ${response.status}` };
    }

    console.log('[whatsapp] Lead notification sent successfully to owner.');
    return { success: true };
  } catch (err) {
    console.error('[whatsapp] Network error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsAppLead };
