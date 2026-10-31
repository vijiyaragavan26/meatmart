"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.optionalAuthenticate, orderController_1.createOrder);
router.get('/', auth_1.authenticate, orderController_1.getMyOrders);
router.get('/my-orders', auth_1.authenticate, orderController_1.getMyOrders);
router.get('/:id', auth_1.authenticate, orderController_1.getOrderById);
router.get('/:id/tracking', orderController_1.getOrderTracking); // Customer and delivery tracking view
router.post('/:id/cancel', auth_1.authenticate, orderController_1.cancelOrder);
exports.default = router;
