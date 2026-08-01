import express from 'express';
import db from '../db.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Create Razorpay Payment Intent (Sandbox)
router.post('/create-razorpay-order', (req, res) => {
  try {
    const { order_id, amount } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({ error: 'order_id and amount required' });
    }

    const razorpayOrderId = `rzp_order_${uuidv4().substring(0, 10)}`;
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_kerala_restaurant_key';

    res.json({
      success: true,
      razorpay_order_id: razorpayOrderId,
      key_id: razorpayKeyId,
      amount: Math.round(amount * 100), // in paise
      currency: 'INR',
      notes: { order_id }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process / Settle Payment (Sandbox payment completion & HMAC signature verification)
router.post('/settle', (req, res) => {
  try {
    const { order_id, method, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const txnId = razorpay_payment_id || `pay_txn_${uuidv4().substring(0, 10)}`;
    const rzpOrderId = razorpay_order_id || `rzp_order_${uuidv4().substring(0, 8)}`;

    // --- Idempotency Check: reject duplicate payment_id (Razorpay retry protection) ---
    const existingPayment = db.prepare('SELECT * FROM payments WHERE gateway_txn_id = ?').get(txnId);
    if (existingPayment) {
      // Already processed — return success without re-processing
      return res.json({
        success: true,
        message: 'Payment already processed (idempotent)',
        payment_id: existingPayment.id,
        txn_id: txnId,
        receipt_url: `/api/payment/receipt/${order_id}`
      });
    }

    // Verify HMAC signature in production mode if keys exist
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
      const generatedSignature = crypto.createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Razorpay HMAC signature verification failed' });
      }
    }

    const payId = `pay_${uuidv4().substring(0, 8)}`;

    db.transaction(() => {
      // 1. Record payment
      db.prepare(`
        INSERT INTO payments (id, order_id, gateway_txn_id, razorpay_order_id, razorpay_payment_id, amount, method, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'success')
      `).run(payId, order_id, txnId, rzpOrderId, txnId, order.total_amount, method || 'UPI');

      // 2. Update order payment status
      db.prepare(`
        UPDATE orders 
        SET payment_status = 'paid', payment_method = ?
        WHERE id = ?
      `).run(method || 'UPI', order_id);
    })();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);

    // Broadcast payment confirmation via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('payment_settled', { order_id, status: 'paid', amount: order.total_amount });
      io.to(`table_${order.table_id}`).emit('table_order_updated', updatedOrder);
    }

    res.json({
      success: true,
      message: 'Payment settled successfully',
      payment_id: payId,
      txn_id: txnId,
      receipt_url: `/api/payment/receipt/${order_id}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Digital Receipt Data endpoint
router.get('/receipt/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    const order = db.prepare(`
      SELECT o.*, t.table_number, r.name as restaurant_name, r.address, r.phone, r.gstin
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const items = db.prepare(`
      SELECT oi.*, m.name_en, m.name_ml
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ?
    `).all(orderId);

    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? LIMIT 1').get(orderId);

    res.json({
      order,
      items,
      payment,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
