"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return app_1.app; } });
const db_1 = require("./config/db");
const trackingSocket_1 = require("./sockets/trackingSocket");
const socketInstance_1 = require("./sockets/socketInstance");
const PORT = process.env.PORT || 5000;
// Always immediately initialize in-memory database store so serverless cold starts have instant data
db_1.memDb.initialize().catch((err) => {
    console.error('[Database] Memory store initialization error:', err);
});
// Attempt PostgreSQL connection if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
    (0, db_1.connectDatabase)().catch((err) => {
        console.warn('[Database] Background Postgres connection warning:', err?.message || err);
    });
}
// Initialize HTTP & Socket.IO server
const server = http_1.default.createServer(app_1.app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH'],
    },
});
(0, socketInstance_1.setSocketIO)(io);
(0, trackingSocket_1.setupTrackingSockets)(io);
// Bind to designated PORT on 0.0.0.0 for Vercel Services, cloud hosting, and local dev
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🥩 MeatMart Backend Server running on port ${PORT}`);
    console.log(`📍 Business Location: Kanjikovil, Erode, Tamil Nadu`);
    console.log(`📡 Socket.IO Real-time Tracking Ready`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`=======================================================`);
});
exports.default = app_1.app;
