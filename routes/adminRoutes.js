const express = require('express');
const { login, getOrders, getOrderDetails, updateOrderStatus, downloadInvoicePDF } = require('../controllers/adminController');
const { authenticateAdmin } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

// Public routes (Rate limited)
router.post('/login', loginLimiter, login);

// Protected routes (Requires valid JWT Bearer token)
router.get('/orders', authenticateAdmin, getOrders);
router.get('/orders/:orderId', authenticateAdmin, getOrderDetails);
router.patch('/orders/:orderId/status', authenticateAdmin, updateOrderStatus);
router.get('/orders/:orderId/invoice', authenticateAdmin, downloadInvoicePDF);

module.exports = router;
