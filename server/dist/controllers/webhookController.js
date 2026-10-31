"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWhatsApp = verifyWhatsApp;
exports.handleWhatsAppWebhook = handleWhatsAppWebhook;
exports.handleEmailWebhook = handleEmailWebhook;
exports.getWebhookLogs = getWebhookLogs;
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const whatsappService_1 = require("../services/whatsappService");
/**
 * WhatsApp Cloud API Webhook Verification (Handshake)
 */
function verifyWhatsApp(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token) {
        const responseChallenge = (0, whatsappService_1.verifyWhatsAppWebhook)(mode, token, challenge);
        if (responseChallenge) {
            console.log('✅ WhatsApp Webhook verified successfully by Meta.');
            return res.status(200).send(responseChallenge);
        }
        console.warn('❌ WhatsApp Webhook verification token mismatch.');
        return res.status(403).json({ error: 'Verification token mismatch' });
    }
    res.status(400).json({ error: 'Missing hub.mode or hub.verify_token query parameter' });
}
/**
 * Handle incoming WhatsApp Webhook events
 */
function handleWhatsAppWebhook(req, res) {
    try {
        const body = req.body;
        (0, whatsappService_1.processWhatsAppWebhook)(body);
        // WhatsApp requires returning a fast 200 OK
        res.status(200).json({ status: 'EVENT_RECEIVED' });
    }
    catch (err) {
        console.error('Error handling WhatsApp webhook:', err);
        res.status(500).json({ error: 'Failed to process webhook' });
    }
}
/**
 * Handle generic Email Provider Webhook (SendGrid, SES, Mailgun, etc.)
 */
function handleEmailWebhook(req, res) {
    try {
        const body = req.body;
        const provider = req.headers['x-provider'] ? String(req.headers['x-provider']) : 'EMAIL_PROVIDER';
        const logEntry = {
            id: `hook-mail-${(0, uuid_1.v4)().substring(0, 8)}`,
            provider,
            eventType: Array.isArray(body) ? body[0]?.event || 'EVENT_BATCH' : body?.event || 'EVENT',
            payload: JSON.stringify(body),
            headers: JSON.stringify(req.headers),
            status: 'PROCESSED',
            createdAt: new Date().toISOString(),
        };
        db_1.memDb.webhookLogs.unshift(logEntry);
        console.log(`[Email Webhook] Recorded event from ${provider}`);
        res.status(200).json({ received: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to process email webhook' });
    }
}
/**
 * Get recent webhook logs (Admin or debug)
 */
function getWebhookLogs(req, res) {
    res.json(db_1.memDb.webhookLogs.slice(0, 50));
}
