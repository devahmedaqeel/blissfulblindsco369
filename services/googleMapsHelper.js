/**
 * Google Maps Helper Service
 * Generates structured maps URL based on installation address and postcode.
 */

/**
 * Generates a Google Maps Search/Redirection Link from address and postcode.
 * @param {string} address The customer's installation address
 * @param {string} postcode The customer's installation postcode
 * @returns {string} Fully formatted and URL-encoded Google Maps link
 */
function generateMapsLink(address, postcode) {
  if (!address && !postcode) return '';
  
  const queryParts = [];
  if (address) queryParts.push(address.trim());
  if (postcode) queryParts.push(postcode.trim());
  
  const query = encodeURIComponent(queryParts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

module.exports = {
  generateMapsLink
};
