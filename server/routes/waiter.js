import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Trigger Call Waiter from Customer App
router.post('/call', (req, res) => {
  try {
    const { table_id, request_type } = req.body;
    if (!table_id) {
      return res.status(400).json({ error: 'table_id required' });
    }

    const callId = `call_${uuidv4().substring(0, 8)}`;
    const reqType = request_type || 'general';

    db.prepare(`
      INSERT INTO waiter_calls (id, table_id, request_type, status)
      VALUES (?, ?, ?, 'pending')
    `).run(callId, table_id, reqType);

    const table = db.prepare('SELECT table_number FROM tables WHERE id = ?').get(table_id);
    const tableNum = table ? table.table_number : table_id;

    const payload = {
      id: callId,
      table_id,
      table_number: tableNum,
      request_type: reqType,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Broadcast live alert to Admin/Staff panels via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('waiter_call_received', payload);
    }

    res.status(201).json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active pending waiter calls (Admin / Staff)
router.get('/pending', (req, res) => {
  try {
    const calls = db.prepare(`
      SELECT w.*, t.table_number
      FROM waiter_calls w
      JOIN tables t ON w.table_id = t.id
      WHERE w.status = 'pending'
      ORDER BY w.created_at ASC
    `).all();

    res.json(calls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge or resolve waiter call
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'acknowledged' or 'resolved'

    db.prepare('UPDATE waiter_calls SET status = ? WHERE id = ?').run(status, id);

    const io = req.app.get('io');
    if (io) {
      io.emit('waiter_call_status_updated', { id, status });
    }

    res.json({ id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
