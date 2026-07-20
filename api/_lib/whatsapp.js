/**
 * WhatsApp notification helper for the existing booking/chatbot lead flow.
 * Supports CallMeBot (Free, zero-config personal API) and Meta Cloud API.
 */

const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP_NUMBER || '+447341645339';
const CALLMEBOT_KEY  = process.env.CALLMEBOT_API_KEY || '';
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
    `🌐 *View on Dashboard:*`,
    `https://blissfulblindsltd.co.uk/admin/orders/`
  ];
  return lines.filter(l => l !== null).join('\n');
}

/**
 * Send a WhatsApp text message and PDF document to the owner.
 * Tries CallMeBot first if callmebot API key is present. Otherwise, falls back to Meta Cloud API.
 */
async function sendWhatsAppLead(leadData, pdfBuffer) {
  // 1. CallMeBot Integration
  if (CALLMEBOT_KEY && CALLMEBOT_KEY !== 'YOUR_CALLMEBOT_KEY_HERE') {
    console.log('[whatsapp] Using CallMeBot API to dispatch booking notification.');
    const text = formatLeadMessage(leadData);
    const recipient = OWNER_WHATSAPP.replace(/[^\d+]/g, ''); // CallMeBot supports international numbers starting with +
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(recipient)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(CALLMEBOT_KEY)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.error('[whatsapp] CallMeBot API error:', errText);
        return { success: false, error: `CallMeBot API ${response.status}` };
      }
      console.log('[whatsapp] CallMeBot lead notification sent successfully.');
      return { success: true };
    } catch (err) {
      console.error('[whatsapp] CallMeBot network error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. Meta Cloud API Integration (Fallback)
  if (!ACCESS_TOKEN || !PHONE_ID || ACCESS_TOKEN === 'YOUR_META_ACCESS_TOKEN_HERE') {
    console.log('[whatsapp] Neither CallMeBot nor Meta Cloud API configured — skipping WhatsApp notification.');
    return { success: false, error: 'Not configured' };
  }

  const recipient = OWNER_WHATSAPP.replace(/[^\d]/g, ''); // Meta expects numeric-only recipient
  const getMetaUrl = (endpoint) => `https://graph.facebook.com/v21.0/${PHONE_ID}/${endpoint}`;
  const getMetaHeaders = (contentType = 'application/json') => ({
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': contentType
  });

  try {
    // Send Text Notification
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

    // Send PDF document if provided
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

    console.log('[whatsapp] Meta Cloud API lead notification sent successfully to owner.');
    return { success: true };
  } catch (err) {
    console.error('[whatsapp] Meta Cloud API delivery error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsAppLead };
