/**
 * WhatsApp notification helper for the existing booking/chatbot lead flow.
 * Sends a formatted text message and the generated lead PDF sheet to the business owner's WhatsApp.
 */

const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER || '+447341645339';
const ACCESS_TOKEN   = process.env.WHATSAPP_ACCESS_TOKEN  || '';
const PHONE_ID       = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

/**
 * Build a clean, readable WhatsApp text message from the lead data.
 */
function formatLeadMessage({ leadId, sourceLabel, name, phone, email, address, postcode, city, service, preferredColor, appointment, message, submittedAt }) {
  const lines = [
    `🔔 *NEW BOOKING ENQUIRY RECEIVED*`,
    `----------------------------------------`,
    `🆔 *Lead ID:* ${leadId || 'N/A'}`,
    `👤 *Customer Name:* ${name || 'N/A'}`,
    phone   ? `📞 *Phone:* ${phone}` : null,
    email   ? `📧 *Email:* ${email}` : null,
    address ? `🏠 *Address:* ${address}, ${city || ''}, ${postcode || ''}` : null,
    service ? `🪟 *Blinds Type:* ${service}` : null,
    preferredColor ? `🎨 *Preferred Colour:* ${preferredColor}` : null,
    appointment ? `⏰ *Best Time to Call:* ${appointment}` : null,
    message ? `💬 *Message:* ${message}` : null,
    `----------------------------------------`,
    `🕐 *Submitted:* ${submittedAt || new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`,
    '',
    '📄 _Lead Details PDF is attached below._'
  ];
  return lines.filter(l => l !== null).join('\n');
}

/**
 * Formats the Meta API URL.
 */
function getMetaUrl(endpoint = 'messages') {
  return `https://graph.facebook.com/v21.0/${PHONE_ID}/${endpoint}`;
}

/**
 * Formats request headers for Meta Cloud API.
 */
function getMetaHeaders(contentType = 'application/json') {
  return {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': contentType
  };
}

/**
 * Send a WhatsApp text message and PDF document to the owner via Meta Cloud API.
 * Never throws — the caller's email flow must never be disrupted by a WhatsApp failure.
 */
async function sendWhatsAppLead(leadData, pdfBuffer) {
  // If Meta API credentials are not configured, skip silently.
  if (!ACCESS_TOKEN || !PHONE_ID || ACCESS_TOKEN === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[whatsapp] Meta API credentials not configured — skipping WhatsApp notification.');
    return { success: false, error: 'Not configured' };
  }

  // Strip the leading '+' for the API (Meta expects numeric-only recipient)
  const recipient = OWNER_WHATSAPP.replace(/[^\d]/g, '');

  try {
    // 1. Send Text Notification
    const textPayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: { body: formatLeadMessage(leadData) }
    };

    const textResponse = await fetch(getMetaUrl('messages'), {
      method: 'POST',
      headers: getMetaHeaders(),
      body: JSON.stringify(textPayload)
    });

    if (!textResponse.ok) {
      const errBody = await textResponse.text();
      console.error('[whatsapp] Failed to send text alert:', errBody);
    }

    // 2. If PDF Buffer is provided, upload and send the PDF document
    if (pdfBuffer) {
      const form = new FormData();
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      form.append('file', blob, `Lead-${leadData.leadId}.pdf`);
      form.append('messaging_product', 'whatsapp');

      const uploadResponse = await fetch(getMetaUrl('media'), {
        method: 'POST',
        headers: getMetaHeaders('multipart/form-data'),
        body: form
      });

      if (!uploadResponse.ok) {
        const uploadErr = await uploadResponse.text();
        throw new Error(`Media upload failed: ${uploadErr}`);
      }

      const uploadResult = await uploadResponse.json();
      const mediaId = uploadResult.id;

      if (mediaId) {
        const docPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipient,
          type: 'document',
          document: {
            id: mediaId,
            filename: `Lead-${leadData.leadId}.pdf`
          }
        };

        const docResponse = await fetch(getMetaUrl('messages'), {
          method: 'POST',
          headers: getMetaHeaders(),
          body: JSON.stringify(docPayload)
        });

        if (!docResponse.ok) {
          const docErr = await docResponse.text();
          console.error('[whatsapp] Failed to send PDF document:', docErr);
        }
      }
    }

    console.log('[whatsapp] Lead notification sent successfully to owner.');
    return { success: true };
  } catch (err) {
    console.error('[whatsapp] WhatsApp delivery error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsAppLead };
