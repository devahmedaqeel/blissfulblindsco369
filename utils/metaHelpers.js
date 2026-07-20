const metaConfig = require('../config/meta');

/**
 * Validates whether the required Meta WhatsApp API configuration parameters are present.
 * @returns {boolean} True if all necessary parameters are available.
 */
function validateMetaConfig() {
  return !!(
    metaConfig.accessToken &&
    metaConfig.phoneNumberId &&
    metaConfig.ownerWhatsappNumber &&
    metaConfig.accessToken !== 'YOUR_META_ACCESS_TOKEN_HERE' &&
    metaConfig.phoneNumberId !== 'YOUR_META_PHONE_NUMBER_ID_HERE'
  );
}

/**
 * Returns the fully qualified URL for a Meta API endpoint.
 * @param {string} endpoint The endpoint path (e.g. 'messages', 'media')
 * @returns {string} Fully qualified URL string
 */
function getMetaUrl(endpoint = 'messages') {
  return `https://graph.facebook.com/${metaConfig.apiVersion}/${metaConfig.phoneNumberId}/${endpoint}`;
}

/**
 * Constructs request headers for Meta Cloud API authentication.
 * @param {string} contentType Header content-type string
 * @returns {Object} Headers mapping
 */
function getMetaHeaders(contentType = 'application/json') {
  return {
    'Authorization': `Bearer ${metaConfig.accessToken}`,
    'Content-Type': contentType
  };
}

/**
 * Formats order detail into a WhatsApp text template.
 *
 * Field-for-field mirror of the owner alert email (services/emailService.js
 * -> sendOwnerAlertEmail) so the owner sees identical information on both
 * channels — same saved Order document, same Google Maps link, no separate
 * data source. If a field is added to the owner email, add it here too.
 *
 * @param {Object} order The Order document (the same one passed to the owner email)
 * @param {string} [mapsLink] The same Google Maps link generated for the owner email
 * @returns {string} Formatted text for WhatsApp
 */
function formatWhatsAppTextBody(order, mapsLink) {
  const formattedDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const timeSubmitted = new Date(order.createdAt || Date.now()).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return `🚨 *NEW ORDER RECEIVED*
----------------------------------------
🏢 *Company:* Blissful Blinds Ltd
🆔 *Order ID:* ${order.orderId}

👤 *Customer Contact Details*
- *Name:* ${order.customer.name}
- *Company Name:* ${order.customer.companyName || 'None'}
- *Email:* ${order.customer.email}
- *Phone:* ${order.customer.phone}
- *WhatsApp Number:* ${order.customer.whatsappNumber}
- *Installation Address:* ${order.customer.address}
- *City & Postcode:* ${order.customer.city}, ${order.customer.postcode}

🪟 *Product Customization*
- *Product Name:* ${order.product.name}
- *Blind Type:* ${order.product.blindType}
- *Colour:* ${order.product.colour}
- *Fabric/Material:* ${order.product.fabric}
- *Dimensions (W x H):* ${order.product.width} cm x ${order.product.height} cm
- *Fitting Details:* ${order.product.fittingType} (${order.product.installationRequired ? 'Installation Required' : 'Supply Only'})
- *Room Location:* ${order.product.room}
- *Ordered Quantity:* ${order.product.quantity}

📅 *Scheduling & Pricing*
- *Preferred Date:* ${formattedDate}
- *Preferred Time Slot:* ${order.scheduling.preferredTime}
- *Special Notes:* ${order.scheduling.specialNotes || 'None'}
- *Subtotal:* £${order.pricing.subtotal.toFixed(2)}
- *VAT (20%):* £${order.pricing.vat.toFixed(2)}
- *Grand Total:* £${order.pricing.grandTotal.toFixed(2)}
- *Customer IP / Browser:* ${order.metadata.ipAddress} / ${order.metadata.browser}

⏰ *Order Time:* ${timeSubmitted}
----------------------------------------
📍 *Route (Google Maps):*
${mapsLink || 'N/A'}

👉 *View in Admin Dashboard:*
https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}`;
}

module.exports = {
  validateMetaConfig,
  getMetaUrl,
  getMetaHeaders,
  formatWhatsAppTextBody
};
