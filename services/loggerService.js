const AuditLog = require('../models/AuditLog');

/**
 * Logs an administrative or system action in the Audit Logs collection.
 * @param {string} orderId The Order ID
 * @param {string} action The short action description (e.g. 'Order Created')
 * @param {string} user Who performed the action (default: 'System')
 * @param {string} details Contextual details about the action
 */
async function logAudit(orderId, action, user = 'System', details = '') {
  try {
    const log = new AuditLog({
      orderId,
      action,
      user,
      details
    });
    await log.save();
    console.log(`[AuditLog] logged: ${action} for order ${orderId}.`);
  } catch (error) {
    console.error(`[AuditLog] Failed to save audit log for order ${orderId}:`, error.message);
  }
}

/**
 * Retrieves audit logs for a specific order.
 * @param {string} orderId 
 */
async function getAuditLogs(orderId) {
  try {
    return await AuditLog.find({ orderId }).sort({ timestamp: 1 });
  } catch (error) {
    console.error(`[AuditLog] Failed to fetch audit logs for order ${orderId}:`, error.message);
    return [];
  }
}

module.exports = {
  logAudit,
  getAuditLogs
};
