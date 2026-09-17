const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function startLocalMongodIfInstalled() {
  // Never spawn local process in production environment
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  const defaultPath = 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe';
  const dataDir = path.resolve(__dirname, '../../data/db');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(defaultPath)) {
    console.log(`[Database] Dev helper: Starting local MongoDB instance from ${defaultPath}...`);
    try {
      const mongodProcess = spawn(defaultPath, ['--dbpath', dataDir, '--port', '27017'], {
        detached: true,
        stdio: 'ignore'
      });
      mongodProcess.unref();
      // Wait up to 5 seconds for port to open
      for (let i = 0; i < 10; i++) {
        await new Promise((res) => setTimeout(res, 500));
        const open = await isPortOpen(27017);
        if (open) {
          console.log('[Database] Local MongoDB process started successfully on port 27017.');
          return true;
        }
      }
    } catch (err) {
      console.warn('[Database] Could not spawn local mongod:', err.message);
    }
  }
  return false;
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eduguard360';
  const isProduction = process.env.NODE_ENV === 'production';
  const isAtlas = uri.startsWith('mongodb+srv://');
  const isLocalhost = uri.includes('127.0.0.1') || uri.includes('localhost');

  // Only attempt local process launch in development with localhost URI
  if (!isProduction && !isAtlas && isLocalhost) {
    const portOpen = await isPortOpen(27017);
    if (!portOpen) {
      console.log('[Database] Local port 27017 is closed. Checking local dev mongod...');
      await startLocalMongodIfInstalled();
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: !isProduction
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    // Fallback retry only for local dev
    if (!isProduction && !isAtlas && isLocalhost) {
      console.log('[Database] Retrying connection after local mongod launch attempt...');
      await startLocalMongodIfInstalled();
      try {
        const retryConn = await mongoose.connect(uri);
        console.log(`[Database] MongoDB Connected on retry: ${retryConn.connection.host}`);
        return retryConn;
      } catch (retryError) {
        console.error(`[Database] Retry failed: ${retryError.message}`);
        throw retryError;
      }
    }
    throw error;
  }
};

module.exports = connectDB;
