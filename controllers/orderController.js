const Order = require('../models/Order');
const { validateOrderSubmission } = require('../utils/validation');
const { processOrderNotifications } = require('../services/notificationService');
const { logAudit } = require('../services/loggerService');

/**
 * Generates a unique Order ID in the format BB-YYYYMMDD-XXXX.
 * E.g., BB-20260720-0001
 */
async function generateUniqueOrderId() {
  const now = new Date();
  
  // Format date as YYYYMMDD
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  // Start and end of today
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));

  // Count orders placed today
  const count = await Order.countDocuments({
    createdAt: { $gte: startOfToday, $lte: endOfToday }
  });

  const nextNumber = count + 1;
  const sequenceStr = String(nextNumber).padStart(4, '0');
  
  return `BB-${dateStr}-${sequenceStr}`;
}

/**
 * Dynamically computes the order pricing details based on dimensions, fabric, and installation.
 * @param {Object} product The product dimensions and options
 */
function calculateOrderPricing(product) {
  // Simple pricing algorithm matching professional window blind pricing models
  // Base price: £35
  const basePrice = 35.00;
  
  // Area rate: Width * Height * 0.02
  const areaRate = (product.width * product.height * 0.02);
  
  // Calculate price per blind
  let pricePerBlind = basePrice + areaRate;

  // Surcharge for fitting type (Inside Recess £0, Outside Recess £10)
  if (product.fittingType === 'Outside Recess') {
    pricePerBlind += 10.00;
  }

  // Surcharge for installation (If required, add £25 per blind for professional installation)
  if (product.installationRequired) {
    pricePerBlind += 25.00;
  }

  const subtotal = pricePerBlind * product.quantity;
  const vat = subtotal * 0.20; // 20% VAT standard UK rate
  const grandTotal = subtotal + vat;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    vat: parseFloat(vat.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  };
}

/**
 * POST /api/orders
 * Creates a new order, saves it, dispatches notification jobs, and alerts the dashboard via WebSockets.
 */
async function createOrder(req, res) {
  try {
    // 1. Run Input Validation & Honeypot Checks
    const validation = await validateOrderSubmission(req.body);
    if (!validation.valid) {
      if (validation.errors._spam) {
        // Quietly fail for spam bots
        return res.status(201).json({ success: true, message: 'Thank you for your submission!' });
      }
      return res.status(400).json({ error: 'Validation failed.', fields: validation.errors });
    }

    const cleanData = validation.data;

    // 2. Generate Unique Order ID
    const orderId = await generateUniqueOrderId();
    
    // 3. Dynamic Price Calculation (Server-side validation of pricing safety)
    const pricing = calculateOrderPricing(cleanData.product);

    // 4. Extract IP and Client Browser details
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const browser = req.headers['user-agent'] || 'Unknown';

    // 5. Construct Order Document
    const order = new Order({
      orderId,
      customer: cleanData.customer,
      product: cleanData.product,
      scheduling: cleanData.scheduling,
      pricing,
      metadata: {
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        browser,
        userAgent: req.headers['user-agent'] || ''
      },
      status: 'New',
      timeline: [{
        status: 'New',
        comment: 'Order submitted by customer.'
      }]
    });

    // Save to database
    await order.save();
    await logAudit(orderId, 'Order Created', 'Customer', 'Customer submitted order successfully via online form.');

    // 6. Instantly alert the Admin Dashboard via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', {
        orderId: order.orderId,
        customerName: order.customer.name,
        grandTotal: order.pricing.grandTotal,
        createdAt: order.createdAt
      });
      console.log(`[Socket.IO] Broadcasted new_order event for ${orderId}.`);
    }

    // 7. Fire notification pipelines (Emails sent synchronously via Promise.all, WhatsApp async)
    const notifyResult = await processOrderNotifications(order);

    // 8. Return Success response within a fraction of a second
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      orderId,
      pricing: order.pricing,
      emailDelivered: notifyResult.success
    });

  } catch (error) {
    console.error('[orderController] Unexpected creation error:', error);
    return res.status(500).json({ error: 'Internal server error processing order. Please call us directly.' });
  }
}

/**
 * GET /api/orders/:orderId/invoice
 * Returns binary stream of the generated PDF invoice for customers (unauthenticated, safe lookup).
 */
async function getInvoiceForCustomer(req, res) {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const { generateInvoicePDF } = require('../services/pdfGenerator');
    const pdfBuffer = await generateInvoicePDF(order);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Order-${orderId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[orderController] PDF Generate Download Error:', error.message);
    return res.status(500).json({ error: 'Failed to generate and download PDF invoice.' });
  }
}

module.exports = {
  createOrder,
  calculateOrderPricing,
  getInvoiceForCustomer
};
