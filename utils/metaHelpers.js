const metaConfig = require('../config/meta');

/**
 * Validates whether the required Meta WhatsApp API configuration parameters are present.
 * @returns {boolean} True if all necessary parameters are available.
 */
function validateMetaConfig() {
  return !!(
    metaConfig.accessToken &&
    metaConfig.phoneNumberId &&
    metaConfig.ownerWhatsappNumber
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
 * Formats order detail into a premium, readable WhatsApp text template.
 * @param {Object} order The Order document
 * @returns {string} Formatted markdown text for WhatsApp
 */
function formatWhatsAppTextBody(order) {
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
👤 *Customer:* ${order.customer.name}
📞 *Phone:* ${order.customer.phone}
📧 *Email:* ${order.customer.email}
🏠 *Address:* ${order.customer.address}, ${order.customer.city}, ${order.customer.postcode}

🪟 *Blind Details:*
- *Type:* ${order.product.name} (${order.product.blindType})
- *Colour:* ${order.product.colour}
- *Measurements:* ${order.product.width} cm (W) x ${order.product.height} cm (H)
- *Quantity:* ${order.product.quantity}
- *Installation Required:* ${order.product.installationRequired ? 'Yes' : 'No'}

💰 *Price Summary:*
- *Subtotal:* £${order.pricing.subtotal.toFixed(2)}
- *VAT (20%):* £${order.pricing.vat.toFixed(2)}
- *Grand Total:* £${order.pricing.grandTotal.toFixed(2)}

📅 *Scheduling & Notes:*
- *Preferred Fitting:* ${formattedDate} (${order.scheduling.preferredTime})
- *Notes:* ${order.scheduling.specialNotes || 'None'}

⏰ *Order Time:* ${timeSubmitted}
🌐 *Website:* https://blissfulblindsltd.co.uk
----------------------------------------
👉 *View in Admin Dashboard:*
https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}`;
}

module.exports = {
  validateMetaConfig,
  getMetaUrl,
  getMetaHeaders,
  formatWhatsAppTextBody
};
