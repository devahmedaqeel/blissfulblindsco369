/*
 * Shared HTML email layout — table-based, every style inline, no external
 * CSS, no flexbox/grid, no CSS variables, no CSS gradients on the header.
 * This is deliberate: Outlook desktop renders email with Word's engine
 * (no flexbox/grid support at all), and Gmail strips <style> blocks in
 * some contexts — inline styles + tables are the only layout approach
 * that reliably survives across Gmail, Outlook, Apple Mail, and Yahoo.
 */

const BRAND = {
  navy: '#0f172a',
  navyLight: '#1c2c4c',
  accent: '#d97706',
  accentLight: '#fef3c7',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff'
};

const SITE_URL = 'https://blissfulblindsltd.co.uk';
const PHONE_DISPLAY = '01733 853037';
const PHONE_TEL = '+441733853037';
const EMAIL = process.env.MAIL_TO || 'info@blissfulblindsltd.co.uk';
const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=+447341645339';
const FACEBOOK_URL = 'https://www.facebook.com/share/198UbT36kZ/?mibextid=wwXIfr';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Wraps body content (already-built HTML for the inner card) in the full
 * document + branded header/footer. `previewText` is the hidden preheader
 * snippet shown next to the subject line in inbox lists.
 */
function wrapEmailLayout({ title, previewText, bodyHtml }) {
  return `<!doctype html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(title)}</title>
<!--[if mso]>
<style type="text/css">
  table, td { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${escapeHtml(previewText || '')}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:${BRAND.white}; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(15,23,42,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.navy}; padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif; color:${BRAND.white};">
                    <span style="font-size:20px; font-weight:700; letter-spacing:0.02em;">Blissful Blinds Ltd</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Accent line -->
          <tr>
            <td style="background-color:${BRAND.accent}; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px; font-family:Arial,Helvetica,sans-serif; color:${BRAND.text};">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.navy}; padding:28px 32px; font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:${BRAND.white}; font-size:14px; font-weight:700; padding-bottom:6px;">
                    Blissful Blinds Ltd
                  </td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.65); font-size:12px; line-height:1.7; padding-bottom:14px;">
                    75 Ringwood Bretton, Peterborough, PE3 9SR, United Kingdom<br>
                    &#128222; <a href="tel:${PHONE_TEL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${PHONE_DISPLAY}</a>
                    &nbsp;&middot;&nbsp;
                    &#9993; <a href="mailto:${EMAIL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${EMAIL}</a>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${WHATSAPP_URL}" style="display:inline-block; margin-right:10px; padding:6px 14px; border-radius:999px; background-color:#25d366; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">WhatsApp</a>
                    <a href="${FACEBOOK_URL}" style="display:inline-block; margin-right:10px; padding:6px 14px; border-radius:999px; background-color:rgba(255,255,255,0.12); color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">Facebook</a>
                    <a href="${SITE_URL}" style="display:inline-block; padding:6px 14px; border-radius:999px; background-color:rgba(255,255,255,0.12); color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">Website</a>
                  </td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.4); font-size:10px; padding-top:16px;">
                    This is an automated message from blissfulblindsltd.co.uk. Please do not reply directly to this address unless invited to.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { wrapEmailLayout, escapeHtml, BRAND, PHONE_DISPLAY, PHONE_TEL, EMAIL, WHATSAPP_URL };
