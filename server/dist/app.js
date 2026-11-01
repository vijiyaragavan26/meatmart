"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const deliveryRoutes_1 = __importDefault(require("./routes/deliveryRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const webhookRoutes_1 = __importDefault(require("./routes/webhookRoutes"));
const productController_1 = require("./controllers/productController");
exports.app = (0, express_1.default)();
// Security and utility middlewares
exports.app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
exports.app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
    exports.app.use((0, morgan_1.default)('dev'));
}
const healthHandler = (req, res) => {
    res.json({
        status: 'online',
        store: 'MeatMart Fresh Meats & Masalas',
        location: 'Kanjikovil, Erode, Tamil Nadu',
        timestamp: new Date().toISOString(),
    });
};
// Health check endpoint (both /api/health and /health)
exports.app.get('/api/health', healthHandler);
exports.app.get('/health', healthHandler);
// REST API Routes (mounted on both /api/* and /* for compatibility with all hosting environments)
exports.app.get('/api/categories', productController_1.getCategories);
exports.app.get('/categories', productController_1.getCategories);
exports.app.get('/api/brands', productController_1.getBrands);
exports.app.get('/brands', productController_1.getBrands);
exports.app.use('/api/auth', authRoutes_1.default);
exports.app.use('/auth', authRoutes_1.default);
exports.app.use('/api/products', productRoutes_1.default);
exports.app.use('/products', productRoutes_1.default);
exports.app.use('/api/orders', orderRoutes_1.default);
exports.app.use('/orders', orderRoutes_1.default);
exports.app.use('/api/delivery', deliveryRoutes_1.default);
exports.app.use('/delivery', deliveryRoutes_1.default);
exports.app.use('/api/admin', adminRoutes_1.default);
exports.app.use('/admin', adminRoutes_1.default);
exports.app.use('/api/payments', paymentRoutes_1.default);
exports.app.use('/payments', paymentRoutes_1.default);
exports.app.use('/api/notifications', notificationRoutes_1.default);
exports.app.use('/notifications', notificationRoutes_1.default);
exports.app.use('/api/webhooks', webhookRoutes_1.default);
exports.app.use('/webhooks', webhookRoutes_1.default);
// Serve client production build so port 5000 also serves the full UI
const clientDistPath = path_1.default.resolve(__dirname, '../../client/dist');
exports.app.use(express_1.default.static(clientDistPath));
exports.app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
        return next();
    }
    const indexPath = path_1.default.join(clientDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err)
            next();
    });
});
// 404 handler for unmatched API routes
exports.app.use((req, res) => {
    res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});
// Global error handler
exports.app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
});
