import { memDb, prisma, isPostgresConnected } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v20.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'meatmart_kanjikovil_verify_token_2026';

export interface WhatsAppNotificationPayload {
  to: string; // E.164 without +, e.g. "919876543210"
  type: 'template' | 'text';
  templateName?: string;
  bodyText?: string;
  components?: any[];
}

/**
 * Format phone numbers into Indian standard WhatsApp format (91XXXXXXXXXX)
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Dispatches an official WhatsApp Cloud API payload or simulates it in local/development mode
 */
export async function sendWhatsAppMessage(payload: WhatsAppNotificationPayload): Promise<{
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}> {
  const recipient = formatPhoneNumberForWhatsApp(payload.to);
  const isCloudApiConfigured = Boolean(WHATSAPP_PHONE_NUMBER_ID && WHATSAPP_ACCESS_TOKEN);

  if (isCloudApiConfigured) {
    try {
      const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const bodyData: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
      };

      if (payload.type === 'template' && payload.templateName) {
        bodyData.type = 'template';
        bodyData.template = {
          name: payload.templateName,
          language: { code: 'en' },
          components: payload.components || [],
        };
      } else {
        bodyData.type = 'text';
        bodyData.text = { preview_url: true, body: payload.bodyText || '' };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data: any = await response.json();

      if (!response.ok) {
        console.error('[WhatsApp Cloud API Error]:', data);
        recordNotificationLog({
          channel: 'WHATSAPP',
          recipient,
          eventType: payload.templateName || 'TEXT',
          status: 'FAILED',
          payload: JSON.stringify(bodyData),
          error: JSON.stringify(data),
        });
        return { success: false, error: data?.error?.message || 'WhatsApp Cloud API request failed' };
      }

      const messageId = data?.messages?.[0]?.id;
      recordNotificationLog({
        channel: 'WHATSAPP',
        recipient,
        eventType: payload.templateName || 'TEXT',
        status: 'SENT',
        payload: JSON.stringify(bodyData),
      });

      return { success: true, messageId };
    } catch (err: any) {
      console.error('[WhatsApp Network Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Fallback: Robust Simulated Mode for Local Development & Testing
  const simMessageId = `wamid.HBgL${uuidv4().substring(0, 12)}==`;
  console.log(`\n================== [WHATSAPP CLOUD API SIMULATOR] ==================`);
  console.log(`📱 TO: +${recipient}`);
  console.log(`🏷️  TYPE: ${payload.type.toUpperCase()}`);
  if (payload.templateName) console.log(`📋 TEMPLATE: ${payload.templateName}`);
  if (payload.bodyText) console.log(`💬 MESSAGE:\n${payload.bodyText}`);
  console.log(`🆔 SIMULATED MESSAGE ID: ${simMessageId}`);
  console.log(`===================================================================\n`);

  recordNotificationLog({
    channel: 'WHATSAPP',
    recipient,
    eventType: payload.templateName || 'SIMULATED_TEXT',
    status: 'SIMULATED',
    payload: JSON.stringify(payload),
  });

  return { success: true, messageId: simMessageId, simulated: true };
}

export function getDirectWhatsAppUrl(phone: string, text: string): string {
  const formatted = formatPhoneNumberForWhatsApp(phone);
  return `https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(text)}`;
}

/**
 * Send WhatsApp OTP Verification Message
 */
export async function sendWhatsAppOtp(phone: string, otp: string) {
  const messageText = `🥩 *MeatMart Kanjikovil*\n\nYour one-time verification code is: *${otp}*\n\nValid for 5 minutes. Please do not share this code with anyone.\nFresh Meats & Sakthi Masalas delivered fast!`;

  const sendResult = await sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_otp_verification',
    bodyText: messageText,
  });

  const directUrl = getDirectWhatsAppUrl(phone, messageText);
  return {
    ...sendResult,
    directWhatsAppUrl: directUrl,
    messageText,
  };
}

/**
 * Send WhatsApp Order Confirmation
 */
export async function sendWhatsAppOrderConfirmed(phone: string, order: any) {
  const itemsText = order.items
    ?.map((it: any) => `• ${it.productName} (${it.selectedWeight || it.productUnit}) × ${it.quantity} - ₹${it.totalPrice}`)
    .join('\n');

  const text = `🎉 *Order Confirmed! — MeatMart Kanjikovil*\n\n` +
    `Hello! Your order *#${order.orderNumber}* has been successfully received.\n\n` +
    `📦 *Order Summary:*\n${itemsText}\n\n` +
    `💰 *Total Amount:* ₹${order.totalAmount} (${order.paymentMethod})\n` +
    `📍 *Delivery Address:* ${order.deliveryAddress?.streetAddress || 'Kanjikovil'}, ${order.deliveryAddress?.area || 'Erode'}\n` +
    `⏰ *Estimated Delivery Slot:* ${order.deliverySlot || 'Express'}\n\n` +
    `We are preparing your fresh cut with hygienic safety standards. Track live anytime at: https://meatmart.kanjikovil.in/orders`;

  const sendResult = await sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_order_confirmed',
    bodyText: text,
  });

  return {
    ...sendResult,
    directWhatsAppUrl: getDirectWhatsAppUrl(phone, text),
    messageText: text,
  };
}

/**
 * Send WhatsApp Delivery Partner Assigned Alert
 */
export async function sendWhatsAppDriverAssigned(phone: string, order: any, partner: any) {
  const text = `🚴 *Delivery Partner Assigned! — MeatMart*\n\n` +
    `Order: *#${order.orderNumber}*\n` +
    `Delivery Partner: *${partner?.user?.fullName || partner?.fullName || 'Poopesh'}*\n` +
    `📞 Phone: *+91 ${partner?.user?.phoneNumber || partner?.phoneNumber || '9360761595'}*\n` +
    `🛵 Vehicle: *${partner?.vehicleType || 'Hero Splendor'} (${partner?.vehicleNumber || 'TN 33 BM 7890'})*\n\n` +
    `Your delivery partner is on the way to pick up your order from our Kanjikovil hub.`;

  return sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_partner_assigned',
    bodyText: text,
  });
}

/**
 * Send WhatsApp Out for Delivery with Live GPS Link and OTP
 */
export async function sendWhatsAppOutForDelivery(phone: string, order: any, liveTrackingUrl: string) {
  const text = `🚀 *Out for Delivery! — MeatMart*\n\n` +
    `Your order *#${order.orderNumber}* is out for delivery in Kanjikovil!\n\n` +
    `🔑 *Proof of Delivery OTP:* *${order.proofOfDeliveryOtp || '4829'}*\n` +
    `Share this 4-digit code with your delivery partner only upon receiving your package.\n\n` +
    `🗺️ *Live GPS Tracking:* ${liveTrackingUrl || `https://meatmart.kanjikovil.in/tracking/${order.id}`}\n\n` +
    `Keep your phone handy!`;

  return sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_out_for_delivery',
    bodyText: text,
  });
}

/**
 * Send WhatsApp Order Delivered Celebration
 */
export async function sendWhatsAppOrderDelivered(phone: string, order: any) {
  const text = `✅ *Order Delivered! — MeatMart Kanjikovil*\n\n` +
    `Your order *#${order.orderNumber}* has been safely delivered to your doorstep.\n\n` +
    `Thank you for choosing MeatMart! We hope you enjoy your fresh farm chicken and authentic Sakthi Masalas.\n\n` +
    `⭐ How was your experience? Leave us a review: https://meatmart.kanjikovil.in/orders`;

  return sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_order_delivered',
    bodyText: text,
  });
}

/**
 * Send WhatsApp Order Cancelled / Refund Notice
 */
export async function sendWhatsAppOrderCancelled(phone: string, order: any, reason: string) {
  const refundText = order.paymentMethod !== 'COD'
    ? `Any prepaid payment of ₹${order.totalAmount} will be refunded to your source account within 2-4 business days.`
    : `As this was a Cash on Delivery order, no payment was deducted.`;

  const text = `⚠️ *Order Update — MeatMart Kanjikovil*\n\n` +
    `Your order *#${order.orderNumber}* has been cancelled.\n` +
    `Reason: ${reason || 'Customer request'}\n\n` +
    `${refundText}\n\n` +
    `Need help? Call our Kanjikovil customer support at +91 76049 06429.`;

  return sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_order_cancelled',
    bodyText: text,
  });
}

/**
 * Send WhatsApp Admin Login Security Alert
 */
export async function sendWhatsAppAdminLoginAlert(
  phone: string,
  adminName: string = 'Vijay',
  details?: { time?: string; ip?: string }
) {
  const loginTime = details?.time || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
  const ip = details?.ip || '127.0.0.1';

  const text = `🛡️ *MeatMart Security Alert — Admin Login*\n\n` +
    `Hello *${adminName}*! A successful login to your *MeatMart Administrator Dashboard* was just completed.\n\n` +
    `⏰ *Time:* ${loginTime}\n` +
    `📱 *Account:* +91 ${formatPhoneNumberForWhatsApp(phone).replace(/^91/, '')}\n` +
    `🌐 *Location/IP:* ${ip}\n` +
    `🔒 *Role:* SUPER ADMIN\n\n` +
    `If this was you, you can safely ignore this alert. All store operations are functioning normally.\n` +
    `MeatMart Kanjikovil Operations Center.`;

  return sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_admin_login_alert',
    bodyText: text,
  });
}

/**
 * Send WhatsApp Customer Welcome Notification
 */
export async function sendWhatsAppCustomerWelcome(phone: string, customerName: string = 'Valued Customer') {
  const text = `🎉 *Welcome to MeatMart Kanjikovil, ${customerName}!* 🥩\n\n` +
    `Thank you for creating your MeatMart account!\n\n` +
    `We deliver 100% Halal farm-fresh chicken (Nattu Kozhi, Curry Cut, Boneless) and genuine Sakthi Masalas directly to your doorstep in *30–45 minutes* across Kanjikovil & Perundurai.\n\n` +
    `🎁 *Welcome Offer for You:*\n` +
    `Use coupon code *FREESHIP* for Free Delivery on your first order!\n\n` +
    `🛒 *Shop fresh cuts now:* https://meatmart.kanjikovil.in\n` +
    `📞 *Customer Care:* +91 76049 06429\n\n` +
    `_MeatMart Fresh Meats & Masalas, Kanjikovil, Erode 638116._`;

  return sendWhatsAppMessage({
    to: phone,
    type: 'text',
    templateName: 'meatmart_customer_welcome',
    bodyText: text,
  });
}

/**
 * Meta Webhook Verification (Handshake)
 */
export function verifyWhatsAppWebhook(mode: string, token: string, challenge: string): string | null {
  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    return challenge;
  }
  return null;
}

/**
 * Meta Webhook Event Processor
 */
export function processWhatsAppWebhook(body: any) {
  const logEntry = {
    id: `hook-wa-${uuidv4().substring(0, 8)}`,
    provider: 'WHATSAPP',
    eventType: body?.entry?.[0]?.changes?.[0]?.value?.statuses ? 'STATUS_UPDATE' : 'INCOMING_MESSAGE',
    payload: JSON.stringify(body),
    status: 'PROCESSED',
    createdAt: new Date().toISOString(),
  };

  memDb.webhookLogs.unshift(logEntry);

  // If status update (sent, delivered, read)
  const statuses = body?.entry?.[0]?.changes?.[0]?.value?.statuses;
  if (Array.isArray(statuses)) {
    for (const st of statuses) {
      console.log(`[WhatsApp Webhook] Message ${st.id} status: ${st.status}`);
    }
  }

  return { success: true };
}

function recordNotificationLog(data: {
  channel: string;
  recipient: string;
  eventType: string;
  status: string;
  payload: string;
  error?: string;
}) {
  const entry = {
    id: `notif-${uuidv4().substring(0, 8)}`,
    ...data,
    createdAt: new Date().toISOString(),
  };
  memDb.notificationEvents.unshift(entry);
}
