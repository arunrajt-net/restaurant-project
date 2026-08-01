import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

import { initDb } from './db.js';
import { seedData } from './seedData.js';

import restaurantRoutes from './routes/restaurant.js';
import menuRoutes from './routes/menu.js';
import tableRoutes from './routes/tables.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes from './routes/payment.js';
import voiceRoutes from './routes/voice.js';
import waiterRoutes from './routes/waiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

app.set('io', io);

// --- Rate Limiting (fix #3: abuse protection) ---
// General API: 200 requests per minute per IP (covers menu browsing, cart reads)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

// Strict limiter for order/payment endpoints: 20 per minute per IP
const orderPaymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Order/payment rate limit exceeded. Please wait a moment.' }
});

// Voice matching: 30 per minute per IP
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Voice request rate limit exceeded.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', generalLimiter);

// Initialize DB & Seed Data
initDb();
seedData();

// Register API Routes
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderPaymentLimiter, orderRoutes);   // 20/min — order creation
app.use('/api/payment', orderPaymentLimiter, paymentRoutes); // 20/min — payment settlement
app.use('/api/voice', voiceLimiter, voiceRoutes);            // 30/min — voice matching
app.use('/api/waiter', waiterRoutes);

// Socket.IO Room logic for table-specific carts & real-time KDS updates
io.on('connection', (socket) => {
  // Join table room
  socket.on('join_table', (tableId) => {
    socket.join(`table_${tableId}`);
    console.log(`Socket ${socket.id} joined room table_${tableId}`);
  });

  // Join KDS room
  socket.on('join_kds', () => {
    socket.join('kds_room');
    console.log(`Socket ${socket.id} joined KDS room`);
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Kerala Restaurant QR System API Server running on port ${PORT}`);
});
