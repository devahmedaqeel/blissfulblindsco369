const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * PDF Generator Service
 * Creates professional branded PDF invoices using PDFKit with embedded QR codes.
 */

/**
 * Generates a branded PDF Invoice for a given order.
 * @param {Object} order The Order object from MongoDB
 * @returns {Promise<Buffer>} The PDF document compiled into a binary buffer
 */
async function generateInvoicePDF(order) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (err) => {
        reject(err);
      });

      // Palette Colors
      const PRIMARY_COLOR = '#0F172A'; // Slate 900
      const SECONDARY_COLOR = '#475569'; // Slate 600
      const ACCENT_COLOR = '#E11D48'; // Rose 600
      const BORDER_COLOR = '#E2E8F0'; // Slate 200
      const BG_LIGHT = '#F8FAFC'; // Slate 50

      // --- HEADER SECTION ---
      // Branded Logo
      const logoPath = path.join(__dirname, '..', 'images', 'logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 40, { width: 140 });
      } else {
        // Fallback text branding if logo is missing
        doc.fillColor(ACCENT_COLOR).font('Helvetica-Bold').fontSize(22).text('Blissful Blinds Ltd', 40, 40);
        doc.fontSize(8).fillColor(SECONDARY_COLOR).font('Helvetica').text('MADE TO MEASURE SHUTTERS & BLINDS', 40, 65);
      }

      // Invoice metadata (Right aligned)
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(20).text('INVOICE / ORDER SUMMARY', 300, 40, { align: 'right' });
      
      doc.font('Helvetica-Bold').fontSize(10).fillColor(PRIMARY_COLOR).text('Order ID: ', 370, 70, { align: 'right', continued: true })
         .font('Helvetica').fillColor(ACCENT_COLOR).text(order.orderId);
         
      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      doc.font('Helvetica-Bold').fillColor(PRIMARY_COLOR).fontSize(9).text('Date: ', 370, 85, { align: 'right', continued: true })
         .font('Helvetica').fillColor(SECONDARY_COLOR).text(orderDate);

      // Spacer
      doc.moveDown(2);

      // --- ADDRESSES GRID (Company & Customer Info) ---
      const gridTop = 130;
      doc.lineCap('butt').moveTo(40, gridTop - 15).lineTo(555, gridTop - 15).strokeColor(BORDER_COLOR).lineWidth(1).stroke();

      // Company info (Left column)
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('Seller Details', 40, gridTop);
      doc.font('Helvetica-Bold').fontSize(10).text('Blissful Blinds Ltd');
      doc.font('Helvetica').fontSize(9).fillColor(SECONDARY_COLOR)
         .text('75 Ringwood Bretton')
         .text('Peterborough, PE3 9SR')
         .text('Company No: 17329706')
         .text('Phone: 01733 853037')
         .text('WhatsApp: +447341645339')
         .text('Email: info@blissfulblindsltd.co.uk');

      // Customer info (Right column)
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('Customer Details', 320, gridTop);
      doc.font('Helvetica-Bold').fontSize(10).text(order.customer.name);
      if (order.customer.companyName) {
        doc.font('Helvetica').fontSize(9).fillColor(SECONDARY_COLOR).text(order.customer.companyName);
      }
      doc.font('Helvetica').fontSize(9).fillColor(SECONDARY_COLOR)
         .text(order.customer.address)
         .text(`${order.customer.city}, ${order.customer.postcode}`)
         .text(`Phone: ${order.customer.phone}`)
         .text(`WhatsApp: ${order.customer.whatsappNumber}`)
         .text(`Email: ${order.customer.email}`);

      // Spacer
      doc.moveDown(3);

      // --- ITEM DETAILED TABLE ---
      const tableTop = 270;
      // Draw Table Header Background
      doc.rect(40, tableTop, 515, 20).fill(PRIMARY_COLOR);
      
      // Table Header text
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
      doc.text('Item Description', 45, tableTop + 6, { width: 180 });
      doc.text('Room', 230, tableTop + 6, { width: 60 });
      doc.text('Dimensions', 300, tableTop + 6, { width: 90 });
      doc.text('Fitting / Install', 400, tableTop + 6, { width: 85 });
      doc.text('Qty', 490, tableTop + 6, { width: 20, align: 'center' });
      doc.text('Total', 515, tableTop + 6, { width: 35, align: 'right' });

      // Table Row content
      const rowY = tableTop + 20;
      // Draw Row Background
      doc.rect(40, rowY, 515, 65).fill(BG_LIGHT);
      
      doc.fillColor(PRIMARY_COLOR).fontSize(9);
      // Item Description
      doc.font('Helvetica-Bold').text(order.product.name, 45, rowY + 8);
      doc.font('Helvetica').fillColor(SECONDARY_COLOR).fontSize(8)
         .text(`Type: ${order.product.blindType}`, 45, rowY + 22)
         .text(`Colour: ${order.product.colour}`, 45, rowY + 34)
         .text(`Fabric: ${order.product.fabric}`, 45, rowY + 46);

      // Room
      doc.fillColor(PRIMARY_COLOR).font('Helvetica').fontSize(9).text(order.product.room, 230, rowY + 8);

      // Dimensions
      doc.text(`${order.product.width} W x ${order.product.height} H (cm)`, 300, rowY + 8);

      // Fitting / Install
      doc.fontSize(8).fillColor(SECONDARY_COLOR)
         .text(order.product.fittingType, 400, rowY + 8)
         .text(order.product.installationRequired ? 'Fit & Install Included' : 'Supply Only', 400, rowY + 20);

      // Quantity
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(9).text(String(order.product.quantity), 490, rowY + 8, { width: 20, align: 'center' });

      // Total Price
      const itemTotal = (order.pricing.subtotal).toFixed(2);
      doc.text(`£${itemTotal}`, 515, rowY + 8, { width: 35, align: 'right' });

      // Border line for table bottom
      doc.moveTo(40, rowY + 65).lineTo(555, rowY + 65).strokeColor(BORDER_COLOR).lineWidth(1).stroke();

      // --- PRICING BREAKDOWN & QR CODE BLOCK ---
      const pricingY = rowY + 80;

      // QR Code generation (Left)
      // Generates verification link to verify invoice details
      const verificationUrl = `https://blissfulblindsltd.co.uk/admin/orders/?id=${order.orderId}`;
      try {
        const qrBuffer = await QRCode.toBuffer(verificationUrl, { width: 75, margin: 1 });
        doc.image(qrBuffer, 40, pricingY, { width: 75 });
        doc.fillColor(SECONDARY_COLOR).font('Helvetica').fontSize(7)
           .text('Scan code to verify order', 40, pricingY + 80, { width: 90 });
      } catch (err) {
        console.error('Failed to embed QR code in PDF:', err.message);
      }

      // Pricing labels (Right aligned)
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10);
      
      // Subtotal
      doc.text('Subtotal:', 380, pricingY, { align: 'right', width: 100 });
      doc.font('Helvetica').text(`£${order.pricing.subtotal.toFixed(2)}`, 480, pricingY, { align: 'right', width: 75 });

      // VAT (20%)
      doc.font('Helvetica-Bold').text('VAT (20%):', 380, pricingY + 18, { align: 'right', width: 100 });
      doc.font('Helvetica').text(`£${order.pricing.vat.toFixed(2)}`, 480, pricingY + 18, { align: 'right', width: 75 });

      // Divider line
      doc.moveTo(380, pricingY + 34).lineTo(555, pricingY + 34).strokeColor(BORDER_COLOR).stroke();

      // Grand Total
      doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT_COLOR).text('Grand Total:', 380, pricingY + 40, { align: 'right', width: 100 });
      doc.text(`£${order.pricing.grandTotal.toFixed(2)}`, 480, pricingY + 40, { align: 'right', width: 75 });

      // Scheduling & Notes Box (Bottom Left)
      const notesY = pricingY + 105;
      doc.rect(40, notesY, 515, 55).fill(BG_LIGHT);
      doc.rect(40, notesY, 4, 55).fill(PRIMARY_COLOR);
      
      const prefDate = new Date(order.scheduling.preferredDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(9).text('Preferred Installation Details:', 52, notesY + 6);
      doc.font('Helvetica').fillColor(SECONDARY_COLOR)
         .text(`Date: ${prefDate} | Time Slot: ${order.scheduling.preferredTime}`, 52, notesY + 18)
         .text(`Special Notes: ${order.scheduling.specialNotes || 'None'}`, 52, notesY + 30, { width: 490 });

      // --- TERMS & CONDITIONS ---
      const termsY = notesY + 75;
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(9).text('Terms & Conditions', 40, termsY);
      
      doc.font('Helvetica').fontSize(7.5).fillColor(SECONDARY_COLOR);
      const terms = [
        '1. Deposit: A minimum deposit of 50% of the total order value is required upon order confirmation to initiate manufacturing.',
        '2. Bespoke Orders: All blinds and shutters are custom manufactured to your measurements. Amendments/cancellations cannot be accepted once production has started.',
        '3. Balance: The remaining 50% balance must be settled immediately on the day of professional installation.',
        '4. Warranty: Blissful Blinds Ltd provides a 12-month manufacturer guarantee on materials and 1-year guarantee on fitting workmanship.'
      ];
      
      terms.forEach((line, index) => {
        doc.text(line, 40, termsY + 14 + (index * 11), { width: 515 });
      });

      // --- FOOTER ---
      const footerY = 760;
      doc.lineCap('butt').moveTo(40, footerY - 5).lineTo(555, footerY - 5).strokeColor(BORDER_COLOR).stroke();
      doc.font('Helvetica').fontSize(8).fillColor(SECONDARY_COLOR).text('Blissful Blinds Ltd | Registered in England & Wales | Company Number 17329706', 40, footerY, { align: 'center', width: 515 });
      doc.text('Thank you for choosing Blissful Blinds. We appreciate your business!', 40, footerY + 12, { align: 'center', width: 515 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateInvoicePDF
};
