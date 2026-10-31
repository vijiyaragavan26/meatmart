import http from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { connectDatabase } from './config/db';
import { setupTrackingSockets } from './sockets/trackingSocket';
import { setSocketIO } from './sockets/socketInstance';

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDatabase();

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

startServer().catch(err => {
  console.error('Fatal Server Startup Error:', err);
});
