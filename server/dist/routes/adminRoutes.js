"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const productController_1 = require("../controllers/productController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)(['ADMIN']));
// Dashboard & Analytics
router.get('/dashboard', adminController_1.getDashboardStats);
router.get('/reports', adminController_1.getReports);
// Orders
router.get('/orders', adminController_1.getAllOrders);
router.patch('/orders/:id/status', adminController_1.updateOrderStatus);
router.post('/orders/:id/assign-delivery', adminController_1.assignDeliveryPartner);
// Delivery Tracking & Zones
router.get('/deliveries/active', adminController_1.getActiveDeliveriesMap);
router.get('/delivery-zones', adminController_1.getDeliveryZones);
router.post('/delivery-zones', adminController_1.addDeliveryZone);
router.patch('/delivery-zones/:id', adminController_1.updateDeliveryZone);
router.get('/delivery-slots', adminController_1.getDeliverySlots);
router.get('/delivery-partners', adminController_1.getDeliveryPartners);
router.post('/delivery-partners', adminController_1.addDeliveryPartner);
// Products
router.get('/products', productController_1.getProducts);
router.post('/products', adminController_1.createProduct);
router.patch('/products/:id', adminController_1.updateProduct);
router.patch('/products/:id/toggle-status', adminController_1.toggleProductAvailability);
router.post('/products/:id/images', adminController_1.addProductImage);
router.delete('/products/:id/images/:imageId', adminController_1.deleteProductImage);
router.patch('/products/:id/images/:imageId/primary', adminController_1.setPrimaryProductImage);
// Store Settings
router.get('/settings', adminController_1.getStoreSettings);
router.patch('/settings', adminController_1.updateStoreSettings);
exports.default = router;
