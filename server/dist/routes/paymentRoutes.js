"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const router = (0, express_1.Router)();
router.post('/create-order', paymentController_1.createPaymentOrder);
router.post('/verify', paymentController_1.verifyPayment);
router.post('/webhook', paymentController_1.handleWebhook);
// Order-specific payment aliases
router.post('/:orderId/initiate', paymentController_1.createPaymentOrder);
router.post('/:orderId/verify', paymentController_1.verifyPayment);
exports.default = router;
