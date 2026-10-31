"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const db_1 = require("./config/db");
const trackingSocket_1 = require("./sockets/trackingSocket");
const socketInstance_1 = require("./sockets/socketInstance");
const PORT = process.env.PORT || 5000;
async function startServer() {
    await (0, db_1.connectDatabase)();
    const server = http_1.default.createServer(app_1.app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH'],
        },
    });
    (0, socketInstance_1.setSocketIO)(io);
    (0, trackingSocket_1.setupTrackingSockets)(io);
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
