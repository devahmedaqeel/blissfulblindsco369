import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const BRAND = {
  navy: "#0f172a",
  navyLight: "#1c2c4c",
  accent: "#DC2626", // Use modern red accent to match current website colors
  accentHover: "#991B1B",
  accentLight: "#FEE2E2",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  bg: "#f8fafc",
  rowAlt: "#f8fafc",
  white: "#ffffff",
};

const PHONE_DISPLAY = "07341 645339";
const PHONE_TEL = "+447341645339";
const EMAIL_GMAIL = "blissfulblindsco369@gmail.com";
const BUSINESS_ADDRESS = "75 Ringwood Bretton, Peterborough, PE3 9SR, United Kingdom";
const WHATSAPP_URL = "https://wa.me/447341645339";

const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_ADMIN_TO = process.env.EMAIL_ADMIN_TO || EMAIL_USER;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Blissful Blinds";

let transporterPromise: Promise<nodemailer.Transporter> | null = null;
let usingEthereal = false;

function createRealTransport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

async function createEtherealTransport() {
  const testAccount = await nodemailer.createTestAccount();
  usingEthereal = true;
  console.warn(
    "[email] Using Ethereal test SMTP (no EMAIL_PASS configured). " +
      "Preview links for each sent message will be logged below instead of real delivery."
  );
  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) {
    transporterPromise = EMAIL_PASS ? Promise.resolve(createRealTransport()) : createEtherealTransport();
  }
  return transporterPromise;
}

function escapeHtml(value: string) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapEmailLayout(title: string, previewText: string, bodyHtml: string) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en-GB" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${escapeHtml(previewText || "")}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%; background-color:${BRAND.white}; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(15,23,42,0.08);">
          <tr>
            <td style="background-color:${BRAND.navy}; background:linear-gradient(120deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 50%, ${BRAND.navy} 100%); padding:30px 32px 26px;" align="center">
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:24px; font-weight:800; color:${BRAND.white};">
                Blissful Blinds
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:${BRAND.accent}; margin:2px 0 12px;">
                Specialists
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.accent}; height:4px; line-height:4px; font-size:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px; font-family:Arial,Helvetica,sans-serif; color:${BRAND.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.navy}; padding:28px 32px; font-family:Arial,Helvetica,sans-serif;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color:${BRAND.white}; font-size:14px; font-weight:700; padding-bottom:6px;">
                    Blissful Blinds
                  </td>
                </tr>
                <tr>
                  <td style="color:rgba(255,255,255,0.65); font-size:12px; line-height:1.7; padding-bottom:16px;">
                    ${BUSINESS_ADDRESS}<br>
                    &#128222; <a href="tel:${PHONE_TEL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${PHONE_DISPLAY}</a>
                    &nbsp;&middot;&nbsp;
                    &#9993; <a href="mailto:${EMAIL_GMAIL}" style="color:rgba(255,255,255,0.85); text-decoration:none;">${EMAIL_GMAIL}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:16px;">
                    <a href="${WHATSAPP_URL}" style="display:inline-block; padding:7px 16px; border-radius:999px; background-color:#25d366; color:#ffffff; font-size:11px; font-weight:700; text-decoration:none;">&#128172; WhatsApp Us</a>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid rgba(255,255,255,0.12); padding-top:14px; color:rgba(255,255,255,0.45); font-size:11px; line-height:1.6;">
                    &copy; ${year} Blissful Blinds. All rights reserved.
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

function detailRow(label: string, value: string, index: number) {
  if (!value) return "";
  const bg = index % 2 === 0 ? BRAND.white : BRAND.rowAlt;
  return `
    <tr>
      <td style="background-color:${bg}; padding:13px 18px; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; color:${BRAND.textMuted}; text-transform:uppercase; letter-spacing:0.05em; vertical-align:top; width:170px; border-bottom:1px solid ${BRAND.border};">
        ${escapeHtml(label)}
      </td>
      <td style="background-color:${bg}; padding:13px 18px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; color:${BRAND.text}; border-bottom:1px solid ${BRAND.border};">
        ${escapeHtml(value)}
      </td>
    </tr>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, address, postcode, service, appointmentTime, hearAboutUs, message } = body;

    // Simple backend check
    if (!name || !email || !phone || !postcode || !address || !service || !appointmentTime || !hearAboutUs) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const transporter = await getTransporter();

    // 1. Admin Email
    let i = 0;
    const rows = [
      detailRow("Customer Name", name, i++),
      detailRow("Phone Number", phone, i++),
      detailRow("Email Address", email, i++),
      detailRow("Home Address", address, i++),
      detailRow("Postcode", postcode, i++),
      detailRow("Type of Blinds", service, i++),
      detailRow("Best Time To Call", appointmentTime, i++),
      detailRow("How Did You Hear About Us", hearAboutUs, i++),
      detailRow("Customer Message", message, i++),
      detailRow("Submitted Date & Time", new Date().toLocaleString("en-GB"), i++),
    ].join("");

    const adminHtml = wrapEmailLayout(
      "New Customer Enquiry",
      `New lead from ${name}`,
      `
      <h1 style="margin:0 0 8px; font-family:Arial,Helvetica,sans-serif; font-size:21px; font-weight:800; color:${BRAND.text};">New Customer Booking Enquiry</h1>
      <p style="margin:0 0 26px; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:${BRAND.textSecondary};">A customer just submitted a booking request. Details are below:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BRAND.border}; border-radius:14px; overflow:hidden; margin-bottom:26px;">
        ${rows}
      </table>
      `
    );

    // 2. Customer Email
    const customerHtml = wrapEmailLayout(
      "Thank You for Contacting Blissful Blinds",
      "We have received your enquiry",
      `
      <h1 style="margin:0 0 16px; font-size:20px; font-weight:700; color:${BRAND.text};">Thank You for Contacting Blissful Blinds</h1>
      <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">Hello ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">Thank you for requesting a home consultation. We have successfully received your details.</p>
      <p style="margin:0 0 24px; font-size:15px; line-height:1.7; color:${BRAND.textSecondary};">Our design advisor will contact you shortly to coordinate your consultation date slot.</p>
      `
    );

    // Send Emails
    const [adminInfo, customerInfo] = await Promise.all([
      transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER || "no-reply@example.com"}>`,
        to: EMAIL_ADMIN_TO || EMAIL_GMAIL,
        subject: `🔔 New Lead: ${name} | Blissful Blinds`,
        html: adminHtml,
        replyTo: email,
      }),
      transporter.sendMail({
        from: `"${EMAIL_FROM_NAME}" <${EMAIL_USER || "no-reply@example.com"}>`,
        to: email,
        subject: `Enquiry Confirmation | Blissful Blinds`,
        html: customerHtml,
      }),
    ]);

    if (usingEthereal) {
      console.log("[email] Admin Preview URL:", nodemailer.getTestMessageUrl(adminInfo));
      console.log("[email] Customer Preview URL:", nodemailer.getTestMessageUrl(customerInfo));
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error("API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process lead notification." }, { status: 500 });
  }
}
