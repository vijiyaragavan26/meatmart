"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhookController_1 = require("../controllers/webhookController");
const router = (0, express_1.Router)();
// WhatsApp Cloud API Webhook
router.get('/whatsapp', webhookController_1.verifyWhatsApp);
router.post('/whatsapp', webhookController_1.handleWhatsAppWebhook);
// Email Provider Webhooks
router.post('/email-provider', webhookController_1.handleEmailWebhook);
// Webhook Audit / Inspection
router.get('/logs', webhookController_1.getWebhookLogs);
exports.default = router;
