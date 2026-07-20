const express = require('express');
const { createOrder, getInvoiceForCustomer } = require('../controllers/orderController');
const { orderLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

// POST /api/orders - Creates a new order (Customer submission)
router.post('/', orderLimiter, createOrder);

// GET /api/orders/:orderId/invoice - Publicly streams PDF invoice for checked-out customer
router.get('/:orderId/invoice', getInvoiceForCustomer);

module.exports = router;
