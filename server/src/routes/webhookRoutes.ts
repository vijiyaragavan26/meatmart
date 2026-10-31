import { Router } from 'express';
import {
  verifyWhatsApp,
  handleWhatsAppWebhook,
  handleEmailWebhook,
  getWebhookLogs,
} from '../controllers/webhookController';

const router = Router();

// WhatsApp Cloud API Webhook
router.get('/whatsapp', verifyWhatsApp);
router.post('/whatsapp', handleWhatsAppWebhook);

// Email Provider Webhooks
router.post('/email-provider', handleEmailWebhook);

// Webhook Audit / Inspection
router.get('/logs', getWebhookLogs);

export default router;
