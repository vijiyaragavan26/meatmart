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

// In standard Node.js server environments, start HTTP & Socket.IO server
if (!process.env.VERCEL) {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  setSocketIO(io);
  setupTrackingSockets(io);

  server.listen(Number(PORT), () => {
    console.log(`=======================================================`);
    console.log(`🥩 MeatMart Backend Server running on port ${PORT}`);
    console.log(`📍 Business Location: Kanjikovil, Erode, Tamil Nadu`);
    console.log(`📡 Socket.IO Real-time Tracking Ready`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
  });
}

export default app;
export { app };
