const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
  });

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'eduguard360_super_secret_jwt_key_hackathon_2026_secure');
        socket.user = decoded;
      } catch (err) {
        console.warn('[Socket] Invalid token in handshake, continuing anonymously');
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (user) {
      // Join user specific room
      socket.join(`user:${user.id}`);
      // Join role specific room
      socket.join(`role:${user.role}`);
      if (user.department) {
        socket.join(`dept:${user.department}`);
      }
      console.log(`[Socket] User connected: ${user.id} (${user.role})`);
    } else {
      console.log(`[Socket] Anonymous client connected: ${socket.id}`);
    }

    socket.on('disconnect', () => {
      // Cleanup
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Sends a real-time notification to a user and persists in DB
 */
async function sendNotification({ recipientId, title, message, type, data = {} }) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      data
    });

    if (io) {
      io.to(`user:${recipientId}`).emit('notification', notification);
      console.log(`[Socket] Emitted notification to user:${recipientId} (${type})`);
    }
    return notification;
  } catch (err) {
    console.error('[Socket] Error saving/sending notification:', err.message);
  }
}

/**
 * Broadcast event to a specific role or department
 */
function broadcastEvent(room, eventName, payload) {
  if (io) {
    io.to(room).emit(eventName, payload);
  }
}

module.exports = {
  initSocket,
  getIO,
  sendNotification,
  broadcastEvent
};
