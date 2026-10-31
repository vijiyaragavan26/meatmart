import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { memDb } from '../config/db';
import { verifyWhatsAppWebhook, processWhatsAppWebhook } from '../services/whatsappService';

/**
 * WhatsApp Cloud API Webhook Verification (Handshake)
 */
export function verifyWhatsApp(req: Request, res: Response) {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode && token) {
    const responseChallenge = verifyWhatsAppWebhook(mode, token, challenge);
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
export function handleWhatsAppWebhook(req: Request, res: Response) {
  try {
    const body = req.body;
    processWhatsAppWebhook(body);
    // WhatsApp requires returning a fast 200 OK
    res.status(200).json({ status: 'EVENT_RECEIVED' });
  } catch (err: any) {
    console.error('Error handling WhatsApp webhook:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Handle generic Email Provider Webhook (SendGrid, SES, Mailgun, etc.)
 */
export function handleEmailWebhook(req: Request, res: Response) {
  try {
    const body = req.body;
    const provider = req.headers['x-provider'] ? String(req.headers['x-provider']) : 'EMAIL_PROVIDER';

    const logEntry = {
      id: `hook-mail-${uuidv4().substring(0, 8)}`,
      provider,
      eventType: Array.isArray(body) ? body[0]?.event || 'EVENT_BATCH' : body?.event || 'EVENT',
      payload: JSON.stringify(body),
      headers: JSON.stringify(req.headers),
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
    };

    memDb.webhookLogs.unshift(logEntry);
    console.log(`[Email Webhook] Recorded event from ${provider}`);

    res.status(200).json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process email webhook' });
  }
}

/**
 * Get recent webhook logs (Admin or debug)
 */
export function getWebhookLogs(req: Request, res: Response) {
  res.json(memDb.webhookLogs.slice(0, 50));
}
