import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper to calculate next order number
function getNextOrderNumber() {
  const row = db.prepare('SELECT MAX(order_number) as max_num FROM orders').get();
  return (row && row.max_num) ? row.max_num + 1 : 101;
}

// Create new order from shared cart or direct payload
router.post('/', (req, res) => {
  try {
    const { table_id, items, tip_amount, payment_method } = req.body;

    if (!table_id || (!items && !table_id)) {
      return res.status(400).json({ error: 'table_id and items required' });
    }

    // 1. Fetch restaurant config for tax rates
    const restaurant = db.prepare('SELECT * FROM restaurants LIMIT 1').get();
    const cgstRate = restaurant ? restaurant.cgst_rate : 2.5;
    const sgstRate = restaurant ? restaurant.sgst_rate : 2.5;

    // If items are not passed, fetch from persistent table_cart_items
    let orderItems = items;
    if (!orderItems || orderItems.length === 0) {
      orderItems = db.prepare(`
        SELECT c.menu_item_id, c.quantity, c.special_instructions, m.price
        FROM table_cart_items c
        JOIN menu_items m ON c.menu_item_id = m.id
        WHERE c.table_id = ?
      `).all(table_id);
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    orderItems.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const cgstAmount = Number((subtotal * (cgstRate / 100)).toFixed(2));
    const sgstAmount = Number((subtotal * (sgstRate / 100)).toFixed(2));
    const tip = tip_amount ? Number(tip_amount) : 0;
    const totalAmount = Number((subtotal + cgstAmount + sgstAmount + tip).toFixed(2));

    const orderId = `order_${uuidv4().substring(0, 8)}`;
    const orderNum = getNextOrderNumber();

    // Insert order in transaction
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, table_id, restaurant_id, order_number, status, total_amount, cgst_amount, sgst_amount, tip_amount, payment_status, payment_method)
      VALUES (?, ?, 'rid_001', ?, 'placed', ?, ?, ?, ?, 'pending', ?)
    `);

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (id, order_id, menu_item_id, quantity, special_instructions, price_per_unit, status)
      VALUES (?, ?, ?, ?, ?, ?, 'placed')
    `);

    db.transaction(() => {
      insertOrder.run(orderId, table_id, orderNum, totalAmount, cgstAmount, sgstAmount, tip, payment_method || 'UPI');

      orderItems.forEach(item => {
        const itemObj = db.prepare('SELECT price FROM menu_items WHERE id = ?').get(item.menu_item_id || item.id);
        const unitPrice = item.price || (itemObj ? itemObj.price : 0);
        insertOrderItem.run(
          `oi_${uuidv4().substring(0, 8)}`,
          orderId,
          item.menu_item_id || item.id,
          item.quantity,
          item.special_instructions || '',
          unitPrice
        );
      });

      // Clear table cart
      db.prepare('DELETE FROM table_cart_items WHERE table_id = ?').run(table_id);

      // Update table status to occupied / order_placed
      db.prepare("UPDATE tables SET status = 'order_placed' WHERE id = ?").run(table_id);
    })();

    // Fetch full created order details
    const fullOrder = getFullOrderById(orderId);

    // Socket.IO real-time notification to KDS, Admin, and Table
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order_placed', fullOrder);
      io.to(`table_${table_id}`).emit('table_order_updated', fullOrder);
      io.emit('table_status_changed', { table_id, status: 'order_placed' });
    }

    res.status(201).json(fullOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order details helper
function getFullOrderById(id) {
  const order = db.prepare(`
    SELECT o.*, t.table_number
    FROM orders o
    JOIN tables t ON o.table_id = t.id
    WHERE o.id = ?
  `).get(id);

  if (!order) return null;

  const items = db.prepare(`
    SELECT oi.*, m.name_en, m.name_ml, m.name_hi, m.station, m.image_url, m.veg_flag
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = ?
  `).all(id);

  return { ...order, items };
}

// Get active order for a table
router.get('/table/:tableId/active', (req, res) => {
  try {
    const { tableId } = req.params;
    const order = db.prepare(`
      SELECT id FROM orders 
      WHERE table_id = ? AND status NOT IN ('completed', 'cancelled')
      ORDER BY created_at DESC LIMIT 1
    `).get(tableId);

    if (!order) {
      return res.json({ activeOrder: null });
    }

    const fullOrder = getFullOrderById(order.id);
    res.json({ activeOrder: fullOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// KDS Live Feed: Get active kitchen orders
router.get('/kds/active', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.status IN ('placed', 'preparing', 'ready')
      ORDER BY o.created_at ASC
    `).all();

    const result = orders.map(o => {
      const items = db.prepare(`
        SELECT oi.*, m.name_en, m.name_ml, m.station, m.veg_flag
        FROM order_items oi
        JOIN menu_items m ON oi.menu_item_id = m.id
        WHERE oi.order_id = ?
      `).all(o.id);
      return { ...o, items };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Order Status (KDS / Waiter: placed -> preparing -> ready -> served -> completed)
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    const updatedOrder = getFullOrderById(id);

    if (status === 'completed' || status === 'cancelled') {
      // Free table if no other active orders exist
      const activeCount = db.prepare(`
        SELECT COUNT(*) as cnt FROM orders 
        WHERE table_id = ? AND status NOT IN ('completed', 'cancelled') AND id != ?
      `).get(updatedOrder.table_id, id).cnt;

      if (activeCount === 0) {
        db.prepare("UPDATE tables SET status = 'available' WHERE id = ?").run(updatedOrder.table_id);
      }
    }

    // Broadcast via WebSockets
    const io = req.app.get('io');
    if (io && updatedOrder) {
      io.emit('order_status_changed', updatedOrder);
      io.to(`table_${updatedOrder.table_id}`).emit('table_order_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// All orders list (Admin)
router.get('/all', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `).all();

    const result = orders.map(o => {
      const items = db.prepare(`
        SELECT oi.*, m.name_en
        FROM order_items oi
        JOIN menu_items m ON oi.menu_item_id = m.id
        WHERE oi.order_id = ?
      `).all(o.id);
      return { ...o, items };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
