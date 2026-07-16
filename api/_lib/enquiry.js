const { getServiceClient } = require('./supabase');
const { pushToAdmins } = require('./webpush');

// Maps a page path to a human-readable product name for the "Product
// Interest" field, so an enquiry submitted from /roller-blinds/ reads as
// "Roller Blinds" in the dashboard/email even if the customer didn't
// separately pick a service in the form (e.g. the chatbot lead form has
// no "type of blinds" field of its own).
const PRODUCT_PAGES = {
  'roller-blinds': 'Roller Blinds',
  'roman-blinds': 'Roman Blinds',
  'venetian-blinds': 'Venetian Blinds',
  'vertical-blinds': 'Vertical Blinds',
  'vision-blinds': 'Vision Blinds',
  'wooden-blinds': 'Wooden Blinds',
  'faux-wood-blinds': 'Faux Wood Blinds',
  'pleated-blinds': 'Pleated Blinds',
  'perfect-fit-blinds': 'Perfect Fit Blinds',
  'skylight-blinds': 'Skylight Blinds',
  'blackout-blinds': 'Blackout Blinds',
  'motorised-blinds': 'Motorised Blinds',
  'conservatory-blinds': 'Conservatory Blinds',
  'commercial-blinds': 'Commercial Blinds',
  'window-shutters': 'Window Shutters',
  'window-blinds-range': 'Window Blinds Range'
};

function productInterestFromUrl(pageUrl) {
  if (!pageUrl) return null;
  try {
    const path = new URL(pageUrl).pathname.replace(/^\/|\/$/g, '');
    return PRODUCT_PAGES[path] || null;
  } catch {
    return null;
  }
}

/**
 * Persists one enquiry and pushes a real-time notification to the admin
 * dashboard. Never throws — a database/push hiccup must never fail the
 * customer's form submission when their email already sent successfully.
 * Returns the inserted row's id (or null if persistence is unavailable/
 * failed), which the caller can still report success without.
 */
async function recordEnquiry(data) {
  const supabase = getServiceClient();
  const productInterest = data.service || productInterestFromUrl(data.pageUrl);

  let enquiryId = null;
  if (supabase) {
    try {
      const { data: row, error } = await supabase
        .from('enquiries')
        .insert({
          source: data.source,
          source_label: data.sourceLabel,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          postcode: data.postcode || null,
          service: data.service || null,
          preferred_color: data.preferredColor || null,
          appointment: data.appointment || null,
          hear_about_us: data.hearAboutUs || null,
          message: data.message || null,
          product_interest: productInterest,
          ip: data.ip || null,
          user_agent: data.userAgent || null,
          page_url: data.pageUrl || null,
          referrer: data.referrer || null,
          email_delivered: !!data.emailDelivered
        })
        .select('id')
        .single();

      if (error) {
        console.error('[enquiry] Failed to persist enquiry:', error.message);
      } else {
        enquiryId = row.id;
      }
    } catch (err) {
      console.error('[enquiry] Unexpected error persisting enquiry:', err.message);
    }
  } else {
    console.warn('[enquiry] Supabase not configured — enquiry was emailed but not saved to the dashboard.');
  }

  try {
    await pushToAdmins({
      title: `New ${data.sourceLabel}`,
      body: `${data.name} — ${data.phone || data.email || ''}`.trim(),
      enquiryId,
      url: enquiryId ? `/admin/#enquiry-${enquiryId}` : '/admin/'
    });
  } catch (err) {
    console.error('[enquiry] Push notification failed:', err.message);
  }

  return enquiryId;
}

module.exports = { recordEnquiry };
