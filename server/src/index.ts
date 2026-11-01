import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { connectDatabase, memDb } from './config/db';
import { setupTrackingSockets } from './sockets/trackingSocket';
import { setSocketIO } from './sockets/socketInstance';

const PORT = process.env.PORT || 5000;

// Always immediately initialize in-memory database store so serverless cold starts have instant data
memDb.initialize().catch((err) => {
  console.error('[Database] Memory store initialization error:', err);
});

// Attempt PostgreSQL connection if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  connectDatabase().catch((err) => {
    console.warn('[Database] Background Postgres connection warning:', err?.message || err);
  });
}

// Initialize HTTP & Socket.IO server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

setSocketIO(io);
setupTrackingSockets(io);

// Bind to designated PORT on 0.0.0.0 for Vercel Services, cloud hosting, and local dev
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🥩 MeatMart Backend Server running on port ${PORT}`);
  console.log(`📍 Business Location: Kanjikovil, Erode, Tamil Nadu`);
  console.log(`📡 Socket.IO Real-time Tracking Ready`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

export default app;
export { app, server };
