const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order');
const NotificationLog = require('../models/NotificationLog');
const { logAudit, getAuditLogs } = require('../services/loggerService');
const { generateInvoicePDF } = require('../services/pdfGenerator');
const config = require('../config/config');

/**
 * Admin Controller
 * Handles administrative authentication, dashboard data retrieval, and status updates.
 */

/**
 * POST /api/admin/login
 * Authenticates admin and returns a signed JWT.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const admin = await AdminUser.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    // Sign Token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      success: true,
      token,
      expiresIn: config.jwtExpiresIn
    });
  } catch (error) {
    console.error('[Admin Login] Error:', error.message);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * GET /api/admin/orders
 * Returns paginated, searchable, and filtered list of orders.
 */
async function getOrders(req, res) {
  try {
    const { q, status, page = 1, limit = 50 } = req.query;
    const filter = {};

    // 1. Status Filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 2. Text Search
    if (q) {
      const searchRegex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { orderId: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.email': searchRegex },
        { 'customer.phone': searchRegex },
        { 'customer.postcode': searchRegex },
        { 'product.name': searchRegex },
        { 'product.room': searchRegex }
      ];
    }

    // 3. Execution Query
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const count = await Order.countDocuments(filter);
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .select('orderId customer.name pricing.grandTotal status createdAt');

    return res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page, 10),
      totalCount: count
    });
  } catch (error) {
    console.error('[Admin Orders] Get Error:', error.message);
    return res.status(500).json({ error: 'Internal server error fetching orders.' });
  }
}

/**
 * GET /api/admin/orders/:orderId
 * Fetches comprehensive detail of a single order (timeline, audit, notification logs).
 */
async function getOrderDetails(req, res) {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Fetch related notification logs
    const notificationLogs = await NotificationLog.find({ orderId }).sort({ createdAt: -1 });
    
    // Fetch related administrative audits
    const audits = await getAuditLogs(orderId);

    return res.json({
      order,
      notificationLogs,
      audits
    });
  } catch (error) {
    console.error('[Admin Orders] Details Fetch Error:', error.message);
    return res.status(500).json({ error: 'Internal server error retrieving details.' });
  }
}

/**
 * PATCH /api/admin/orders/:orderId/status
 * Updates the state of an order, adds a timeline element, audit log, and notifies client dashboard.
 */
async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, comment } = req.body;

    const validStatuses = ['New', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status value.' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const oldStatus = order.status;
    if (oldStatus === status) {
      return res.json({ success: true, message: 'Status already matches target.', order });
    }

    // Update Status and Append timeline entry
    order.status = status;
    order.timeline.push({
      status,
      comment: comment || `Status updated from ${oldStatus} to ${status}.`
    });

    await order.save();

    // Log administrative audit
    await logAudit(
      orderId, 
      `Status Update: ${status}`, 
      req.admin.username, 
      `Order status updated from ${oldStatus} to ${status}. Comment: ${comment || 'N/A'}`
    );

    // Emit Socket.IO event to alert admin browser instances
    const io = req.app.get('io');
    if (io) {
      io.emit('status_updated', {
        orderId,
        oldStatus,
        newStatus: status,
        updatedAt: order.updatedAt
      });
    }

    return res.json({
      success: true,
      message: `Order status updated to ${status} successfully.`,
      order
    });
  } catch (error) {
    console.error('[Admin Orders] Status Update Error:', error.message);
    return res.status(500).json({ error: 'Internal server error updating order status.' });
  }
}

/**
 * GET /api/admin/orders/:orderId/invoice
 * Returns binary stream of the generated PDF invoice.
 */
async function downloadInvoicePDF(req, res) {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const pdfBuffer = await generateInvoicePDF(order);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Order-${orderId}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[Admin Orders] PDF Generate Download Error:', error.message);
    return res.status(500).json({ error: 'Failed to generate and download PDF invoice.' });
  }
}

module.exports = {
  login,
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  downloadInvoicePDF
};
