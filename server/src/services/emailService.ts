import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { memDb, prisma, isPostgresConnected } from '../config/db';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || `"MeatMart Fresh Kanjikovil" <${process.env.SMTP_USER || 'support@meatmartkanjikovil.in'}>`;

let transporter: any = null;

function getMailTransporter(): any {
  if (transporter) return transporter;

  if (SMTP_USER && SMTP_PASS) {
    try {
      if (SMTP_USER.includes('gmail.com') || SMTP_HOST.includes('gmail')) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });
      } else {
        transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });
      }
      console.log(`[Email Service] Connected to SMTP server ${SMTP_HOST}:${SMTP_PORT} (${SMTP_USER})`);
      return transporter;
    } catch (err: any) {
      console.warn(`[Email Service] Failed to initialize SMTP transporter:`, err.message);
      return null;
    }
  }
  return null;
}

/**
 * Base email layout wrapper with MeatMart branding
 */
function wrapHtmlEmailTemplate(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #222222; }
    .email-wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #eaeaea; }
    .header { background: linear-gradient(135deg, #C62828 0%, #B71C1C 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .brand-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .brand-subtitle { font-size: 13px; opacity: 0.9; margin: 4px 0 0 0; color: #FFF8F0; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .footer { background-color: #FFF8F0; padding: 20px 24px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #f0e6d6; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #C62828; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0; }
    .otp-box { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #C62828; background-color: #FFF8F0; padding: 16px 24px; border-radius: 8px; text-align: center; display: inline-block; border: 2px dashed #C62828; margin: 16px 0; }
    .item-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
    .item-table th { background-color: #f8f9fa; border-bottom: 2px solid #e9ecef; text-align: left; padding: 10px; color: #495057; }
    .item-table td { padding: 10px; border-bottom: 1px solid #f1f3f5; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-success { background-color: #e8f5e9; color: #2E7D32; }
    .badge-danger { background-color: #ffebee; color: #C62828; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1 class="brand-title">🥩 MeatMart</h1>
      <p class="brand-subtitle">Fresh Chicken & Authentic Sakthi Masalas • Kanjikovil, Erode</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>MeatMart E-Commerce Platform</strong></p>
      <p style="margin: 0 0 6px 0;">Kanjikovil Main Road, Erode District, Tamil Nadu 638116</p>
      <p style="margin: 0;">Customer Care: +91 76049 06429 | support@meatmartkanjikovil.in</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generic mail dispatcher with fallback simulator
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  eventType: string;
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const mailTransporter = getMailTransporter();

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`[Email Sent] Message ${info.messageId} to ${options.to} (${options.subject})`);
      recordNotificationLog({
        channel: 'EMAIL',
        recipient: options.to,
        eventType: options.eventType,
        status: 'SENT',
        payload: JSON.stringify({ subject: options.subject, messageId: info.messageId }),
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[Email Send Error] to ${options.to}:`, err.message);
      recordNotificationLog({
        channel: 'EMAIL',
        recipient: options.to,
        eventType: options.eventType,
        status: 'FAILED',
        payload: JSON.stringify({ subject: options.subject }),
        error: err.message,
      });
      return { success: false, error: err.message };
    }
  }

  // Fallback: Local Email Simulator
  const simMessageId = `sim-email-${uuidv4().substring(0, 8)}`;
  console.log(`\n================== [TRANSACTIONAL EMAIL SIMULATOR] ==================`);
  console.log(`📧 TO: ${options.to}`);
  console.log(`📋 SUBJECT: ${options.subject}`);
  console.log(`🏷️  EVENT: ${options.eventType}`);
  console.log(`🆔 SIMULATED ID: ${simMessageId}`);
  console.log(`💡 NOTE: Configure SMTP_USER and SMTP_PASS in .env to send real emails via Gmail/SendGrid.`);
  console.log(`===================================================================\n`);

  recordNotificationLog({
    channel: 'EMAIL',
    recipient: options.to,
    eventType: options.eventType,
    status: 'SIMULATED',
    payload: JSON.stringify({ subject: options.subject, messageId: simMessageId }),
  });

  return { success: true, messageId: simMessageId, simulated: true };
}

/**
 * 1. Email Verification OTP
 */
export async function sendEmailVerificationOtp(email: string, otp: string, customerName?: string) {
  const name = customerName || 'Valued Customer';
  const html = wrapHtmlEmailTemplate(
    'Verify Your Email - MeatMart',
    `<h2>Confirm Your Email Address</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>Thank you for shopping with MeatMart. Please enter the following 6-digit verification code to confirm your email address:</p>
    <div style="text-align: center;">
      <div class="otp-box">${otp}</div>
    </div>
    <p style="color: #666; font-size: 13px;">This code is valid for <strong>5 minutes</strong>. If you did not request this verification, please disregard this email.</p>
    <p>Happy cooking,<br><strong>Team MeatMart Kanjikovil</strong></p>`
  );

  return sendEmail({
    to: email,
    subject: `MeatMart Verification Code: ${otp}`,
    html,
    eventType: 'EMAIL_VERIFICATION_OTP',
  });
}

/**
 * 2. Order Confirmation & Itemized Invoice
 */
export async function sendOrderConfirmationEmail(email: string, order: any, customerName?: string) {
  const name = customerName || order.deliveryAddress?.recipientName || 'Customer';
  const rows = order.items
    ?.map(
      (it: any) => `<tr>
        <td><strong>${it.productName}</strong><br><small style="color: #666;">${it.selectedWeight || it.productUnit} • ${it.productBrand || 'MeatMart'}</small></td>
        <td style="text-align: center;">${it.quantity}</td>
        <td style="text-align: right;">₹${it.unitPrice}</td>
        <td style="text-align: right; font-weight: bold;">₹${it.totalPrice}</td>
      </tr>`
    )
    .join('');

  const html = wrapHtmlEmailTemplate(
    `Order Confirmation #${order.orderNumber} - MeatMart`,
    `<h2>Order Confirmed! 🎉</h2>
    <p>Hello <strong>${name}</strong>,</p>
    <p>We have received your order <strong>#${order.orderNumber}</strong>. Our butchers in Kanjikovil are preparing your cuts with strict hygiene standards.</p>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 14px 18px; margin: 18px 0; font-size: 14px;">
      <p style="margin: 3px 0;"><strong>Order Number:</strong> #${order.orderNumber}</p>
      <p style="margin: 3px 0;"><strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
      <p style="margin: 3px 0;"><strong>Delivery Slot:</strong> ${order.deliverySlot || 'Express (45 mins)'}</p>
      <p style="margin: 3px 0;"><strong>Delivery Address:</strong> ${order.deliveryAddress?.streetAddress || ''}, ${order.deliveryAddress?.area || 'Kanjikovil'}, Erode - ${order.deliveryAddress?.pincode || '638116'}</p>
    </div>

    <h3>Itemized Invoice</h3>
    <table class="item-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="text-align: right; font-size: 14px; margin-top: 12px; border-top: 2px solid #eaeaea; padding-top: 10px;">
      <p style="margin: 4px 0;">Item Subtotal: <strong>₹${order.itemTotal}</strong></p>
      <p style="margin: 4px 0;">Delivery Fee: <strong>₹${order.deliveryFee}</strong></p>
      ${order.discountAmount > 0 ? `<p style="margin: 4px 0; color: #2E7D32;">Discount: <strong>-₹${order.discountAmount}</strong></p>` : ''}
      <h3 style="margin: 8px 0; color: #C62828;">Final Total: ₹${order.totalAmount}</h3>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://meatmart.kanjikovil.in/orders" class="btn">View Live Order Status</a>
    </div>`
  );

  return sendEmail({
    to: email,
    subject: `Order Confirmed: #${order.orderNumber} - MeatMart Kanjikovil`,
    html,
    eventType: 'ORDER_CONFIRMED',
  });
}

/**
 * 3. Payment Receipt Email
 */
export async function sendPaymentReceiptEmail(email: string, order: any, paymentInfo?: any) {
  const html = wrapHtmlEmailTemplate(
    `Payment Receipt for #${order.orderNumber}`,
    `<h2>Payment Received ✅</h2>
    <p>Thank you for your payment. Your transaction has been completed successfully.</p>
    <div style="background-color: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Order:</strong> #${order.orderNumber}</p>
      <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${order.totalAmount}</p>
      <p style="margin: 4px 0;"><strong>Payment Mode:</strong> ${paymentInfo?.gateway || order.paymentMethod}</p>
      <p style="margin: 4px 0;"><strong>Transaction Reference:</strong> ${paymentInfo?.transactionId || `PAY-${order.id.substring(0, 8)}`}</p>
      <p style="margin: 4px 0;"><strong>Status:</strong> <span class="badge badge-success">SUCCESSFUL</span></p>
    </div>`
  );

  return sendEmail({
    to: email,
    subject: `Payment Receipt: ₹${order.totalAmount} for Order #${order.orderNumber}`,
    html,
    eventType: 'PAYMENT_RECEIPT',
  });
}

/**
 * 4. Driver Assigned & Live GPS Tracking Link
 */
export async function sendDriverAssignedEmail(email: string, order: any, partner: any) {
  const driverName = partner?.user?.fullName || partner?.fullName || 'Poopesh';
  const driverPhone = partner?.user?.phoneNumber || partner?.phoneNumber || '+91 93607 61595';
  const vehicle = `${partner?.vehicleType || 'Hero Splendor'} (${partner?.vehicleNumber || 'TN 33 BM 7890'})`;

  const html = wrapHtmlEmailTemplate(
    `Delivery Partner Assigned - Order #${order.orderNumber}`,
    `<h2>Your Delivery Partner is Assigned! 🚴</h2>
    <p>Great news! A dedicated MeatMart delivery partner has been assigned to your order <strong>#${order.orderNumber}</strong>.</p>
    
    <div style="background-color: #FFF8F0; border: 1px solid #ffe0b2; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 4px 0;"><strong>Delivery Partner:</strong> ${driverName}</p>
      <p style="margin: 4px 0;"><strong>Contact:</strong> ${driverPhone}</p>
      <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${vehicle}</p>
      <p style="margin: 4px 0;"><strong>Delivery Address:</strong> ${order.deliveryAddress?.streetAddress || 'Kanjikovil'}</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="https://meatmart.kanjikovil.in/tracking/${order.id}" class="btn">Track Delivery on Live Map</a>
    </div>`
  );

  return sendEmail({
    to: email,
    subject: `Delivery Partner Assigned for Order #${order.orderNumber} - MeatMart`,
    html,
    eventType: 'DRIVER_ASSIGNED',
  });
}

/**
 * 5. Out for Delivery Alert
 */
export async function sendOutForDeliveryEmail(email: string, order: any, liveTrackingUrl?: string) {
  const html = wrapHtmlEmailTemplate(
    `Order Out for Delivery #${order.orderNumber}`,
    `<h2>Your MeatMart Order is Out for Delivery! 🚀</h2>
    <p>Your package has been freshly packed with temperature-preserving packaging and is on its way to your doorstep.</p>
    
    <div style="text-align: center; margin: 20px 0;">
      <p style="margin-bottom: 8px;"><strong>Proof of Delivery OTP:</strong></p>
      <div class="otp-box">${order.proofOfDeliveryOtp || '4829'}</div>
      <p style="color: #666; font-size: 13px;">Please share this 4-digit code with the delivery partner upon arrival.</p>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${liveTrackingUrl || `https://meatmart.kanjikovil.in/tracking/${order.id}`}" class="btn">View Live GPS Route</a>
    </div>`
  );

  return sendEmail({
    to: email,
    subject: `Out for Delivery: Order #${order.orderNumber} - MeatMart`,
    html,
    eventType: 'OUT_FOR_DELIVERY',
  });
}

/**
 * 6. Order Delivered Celebration & Review Request
 */
export async function sendOrderDeliveredEmail(email: string, order: any) {
  const html = wrapHtmlEmailTemplate(
    `Order Delivered #${order.orderNumber}`,
    `<h2>Delivered! Enjoy Your Fresh Meal 🍗</h2>
    <p>Your order <strong>#${order.orderNumber}</strong> has been successfully delivered to your location in Kanjikovil.</p>
    <p>We thank you for supporting local poultry farmers and choosing MeatMart!</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://meatmart.kanjikovil.in/orders" class="btn" style="background-color: #2E7D32;">Rate Your Order & Experience</a>
    </div>`
  );

  return sendEmail({
    to: email,
    subject: `Order Delivered: #${order.orderNumber} - Thank You!`,
    html,
    eventType: 'ORDER_DELIVERED',
  });
}

/**
 * 7. Order Cancelled / Refund Notice
 */
export async function sendOrderCancelledEmail(email: string, order: any, reason?: string) {
  const html = wrapHtmlEmailTemplate(
    `Order Cancelled #${order.orderNumber}`,
    `<h2>Order Cancelled</h2>
    <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason || 'Customer request'}</p>
    <p>If payment was made online, a full refund of <strong>₹${order.totalAmount}</strong> has been initiated and will credit your account within 2-4 working days.</p>
    <p>If you have any questions, call our Kanjikovil support helpline at +91 76049 06429.</p>`
  );

  return sendEmail({
    to: email,
    subject: `Order Cancelled: #${order.orderNumber} - MeatMart`,
    html,
    eventType: 'ORDER_CANCELLED',
  });
}

/**
 * 8. Password Recovery OTP
 */
export async function sendPasswordRecoveryEmail(email: string, otp: string, customerName?: string) {
  const html = wrapHtmlEmailTemplate(
    'Reset Your Password - MeatMart',
    `<h2>Password Reset Request</h2>
    <p>Hello <strong>${customerName || 'Customer'}</strong>,</p>
    <p>We received a request to reset your password for your MeatMart account.</p>
    <div style="text-align: center;">
      <div class="otp-box">${otp}</div>
    </div>
    <p style="color: #666; font-size: 13px;">This verification code is valid for 5 minutes. If you did not initiate this request, your account is safe and you can ignore this email.</p>`
  );

  return sendEmail({
    to: email,
    subject: `MeatMart Password Reset Code: ${otp}`,
    html,
    eventType: 'PASSWORD_RESET_OTP',
  });
}

/**
 * 9. Admin Login Notification
 */
export async function sendAdminLoginAlertEmail(
  email: string,
  adminName: string = 'Vijay',
  details?: { ip?: string; userAgent?: string; time?: string }
) {
  const loginTime = details?.time || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });
  const ipAddress = details?.ip || '127.0.0.1 (Local Session)';
  const device = details?.userAgent || 'Web Browser (Desktop / Mobile)';

  const html = wrapHtmlEmailTemplate(
    '🛡️ MeatMart Admin Login Notification',
    `<div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #ffebee; color: #C62828; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 20px; border: 1px solid #ef9a9a;">
        🛡️ STORE SECURITY ALERT
      </span>
      <h2 style="margin: 14px 0 6px 0; color: #111;">Admin Login Detected</h2>
      <p style="color: #666; font-size: 14px; margin: 0;">MeatMart Operations & Inventory Management Portal</p>
    </div>

    <p>Hello <strong>${adminName}</strong>,</p>
    <p>A successful sign-in to the <strong>MeatMart Administrator Dashboard</strong> was just completed.</p>

    <div style="background-color: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 18px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #777; width: 35%;"><strong>Admin Account:</strong></td>
          <td style="color: #222; font-weight: bold;">+91 7604906429 (${email})</td>
        </tr>
        <tr>
          <td style="color: #777;"><strong>Timestamp:</strong></td>
          <td style="color: #222;">${loginTime}</td>
        </tr>
        <tr>
          <td style="color: #777;"><strong>IP Address:</strong></td>
          <td style="color: #222; font-family: monospace;">${ipAddress}</td>
        </tr>
        <tr>
          <td style="color: #777;"><strong>Device / Browser:</strong></td>
          <td style="color: #222;">${device}</td>
        </tr>
        <tr>
          <td style="color: #777;"><strong>Access Level:</strong></td>
          <td><span class="badge badge-danger">SUPER ADMIN</span></td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #555;">
      If you performed this sign-in, you can safely disregard this message. Your store session is active and secure.
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="http://localhost:5173/admin/dashboard" class="btn" style="background-color: #111; color: #fff !important;">
        Open Admin Dashboard →
      </a>
    </div>`
  );

  return sendEmail({
    to: email,
    subject: `🛡️ Security Alert: Admin Login Detected (${adminName}) - MeatMart Kanjikovil`,
    html,
    eventType: 'ADMIN_LOGIN_ALERT',
  });
}

/**
 * 10. Customer Welcome Email
 */
export async function sendCustomerWelcomeEmail(email: string, customerName: string = 'Valued Customer') {
  const html = wrapHtmlEmailTemplate(
    '🥩 Welcome to MeatMart Kanjikovil!',
    `<div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; background-color: #e8f5e9; color: #2E7D32; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 20px; border: 1px solid #c8e6c9;">
        🎉 ACCOUNT CREATED SUCCESSFULLY
      </span>
      <h2 style="margin: 16px 0 6px 0; color: #111;">Welcome to MeatMart, ${customerName}!</h2>
      <p style="color: #666; font-size: 14px; margin: 0;">Fresh Meats & Authentic Sakthi Masalas Delivered to Your Doorstep</p>
    </div>

    <p>Hello <strong>${customerName}</strong>,</p>
    <p>Thank you for joining <strong>MeatMart Kanjikovil</strong>! Your customer account has been created successfully.</p>
    
    <p>We take pride in delivering:</p>
    <ul style="color: #444; font-size: 14px; line-height: 1.8;">
      <li>🍗 <strong>100% Halal, Farm-Fresh Chicken</strong> — Country Chicken (Nattu Kozhi), Boneless Breast, Drumsticks, and Curry Cuts.</li>
      <li>🌶️ <strong>Original Sakthi Masalas</strong> — Chicken Masala, Chilli Powder, Turmeric, Coriander, and authentic spice blends from Erode.</li>
      <li>⚡ <strong>Express 30–45 Mins Delivery</strong> across Kanjikovil, Perundurai, and surrounding Kongu regions.</li>
      <li>🧼 <strong>RO Water Cleaned & Sanitized</strong> packaging directly from our processing center.</li>
    </ul>

    <div style="background: linear-gradient(135deg, #FFF8F0 0%, #FFF3E0 100%); border: 2px dashed #C62828; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
      <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #C62828; text-transform: uppercase; letter-spacing: 1px;">
        🎁 New Customer Welcome Gift
      </p>
      <div style="font-size: 26px; font-weight: 900; letter-spacing: 4px; color: #C62828; font-family: monospace; margin: 8px 0;">
        FREESHIP
      </div>
      <p style="margin: 0; font-size: 13px; color: #555;">
        Use coupon code <strong>FREESHIP</strong> at checkout for <strong>FREE Delivery</strong> on your order!
      </p>
    </div>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="http://localhost:5173/home" class="btn" style="padding: 14px 32px; font-size: 15px;">
        Explore Fresh Cuts & Order Now →
      </a>
    </div>

    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
      Need any assistance? Contact our local Kanjikovil support team anytime at <strong>+91 76049 06429</strong> or reply to this email.
    </p>`
  );

  return sendEmail({
    to: email,
    subject: `🥩 Welcome to MeatMart Kanjikovil, ${customerName}! Fresh Poultry & Sakthi Masalas`,
    html,
    eventType: 'CUSTOMER_WELCOME',
  });
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
