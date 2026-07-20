const PDFDocument = require('pdfkit');

/**
 * Generates a professional PDF document for in-home consultation leads.
 * @param {Object} lead Lead details
 * @returns {Promise<Buffer>} PDF buffer
 */
function generateLeadPDF(lead) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    // Colors (Matching Blissful Blinds branding)
    const PRIMARY_COLOR = '#0F172A'; // Dark Slate
    const ACCENT_COLOR = '#C8102E';  // Brand Red
    const LIGHT_BG = '#F8FAFC';
    const BORDER_COLOR = '#E2E8F0';

    // Header Background Accent Stripe
    doc.rect(0, 0, 595, 12).fill(PRIMARY_COLOR);

    // Title / Header
    doc.fillColor(PRIMARY_COLOR);
    doc.font('Helvetica-Bold').fontSize(22).text('Blissful Blinds Ltd', 40, 40);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(ACCENT_COLOR).text('STYLE • PRIVACY • COMFORT', 40, 65);
    
    doc.fillColor(PRIMARY_COLOR);
    doc.font('Helvetica-Bold').fontSize(14).text('LEAD ENQUIRY SHEET', 400, 40, { align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor('#64748B').text(`ID: ${lead.leadId}`, 400, 58, { align: 'right' });
    doc.text(`Date: ${lead.submittedAt}`, 400, 72, { align: 'right' });

    doc.moveTo(40, 95).lineTo(555, 95).strokeColor(BORDER_COLOR).lineWidth(1.5).stroke();

    // Section 1: Customer Contact
    doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT_COLOR).text('Customer Information', 40, 115);
    
    // Draw Box
    doc.rect(40, 135, 515, 80).fill(LIGHT_BG).strokeColor(BORDER_COLOR).stroke();
    
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10);
    doc.text('Customer Name:', 55, 150);
    doc.text('Phone Number:', 55, 170);
    doc.text('Email Address:', 55, 190);

    doc.font('Helvetica').fillColor('#1E293B');
    doc.text(lead.name || 'N/A', 170, 150);
    doc.text(lead.phone || 'N/A', 170, 170);
    doc.text(lead.email || 'N/A', 170, 190);

    // Section 2: Address & Location
    doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT_COLOR).text('Installation Address', 40, 240);
    
    doc.rect(40, 260, 515, 60).fill(LIGHT_BG).strokeColor(BORDER_COLOR).stroke();
    
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10);
    doc.text('Address:', 55, 275);
    doc.text('Postcode / City:', 55, 295);

    doc.font('Helvetica').fillColor('#1E293B');
    doc.text(lead.address || 'N/A', 170, 275);
    doc.text(`${lead.postcode || ''} ${lead.city || ''}`.trim() || 'N/A', 170, 295);

    // Section 3: Request Specifications
    doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT_COLOR).text('Request details', 40, 345);
    
    doc.rect(40, 365, 515, 80).fill(LIGHT_BG).strokeColor(BORDER_COLOR).stroke();
    
    doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10);
    doc.text('Type of Blinds:', 55, 380);
    doc.text('Preferred Colour:', 55, 400);
    doc.text('Preferred Slot:', 55, 420);

    doc.font('Helvetica').fillColor('#1E293B');
    doc.text(lead.service || 'N/A', 170, 380);
    doc.text(lead.preferredColor || 'N/A', 170, 400);
    doc.text(lead.appointment || 'N/A', 170, 420);

    // Section 4: Customer Message
    if (lead.message) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor(ACCENT_COLOR).text('Customer Message', 40, 470);
      
      doc.rect(40, 490, 515, 80).fill('#FEF2F2').strokeColor('#FCA5A5').stroke();
      doc.fillColor(PRIMARY_COLOR).font('Helvetica-Oblique').fontSize(10);
      doc.text(`"${lead.message}"`, 55, 505, { width: 485, lineGap: 4 });
    }

    // Footer Info
    doc.moveTo(40, 780).lineTo(555, 780).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
    doc.fillColor('#94A3B8').font('Helvetica').fontSize(8);
    doc.text('Blissful Blinds Ltd • Registered in England & Wales • Company Number: 17329706', 40, 792, { align: 'center' });
    doc.text('75 Ringwood, Bretton, Peterborough, PE3 9SR • info@blissfulblindsltd.co.uk', 40, 804, { align: 'center' });

    doc.end();
  });
}

module.exports = { generateLeadPDF };
