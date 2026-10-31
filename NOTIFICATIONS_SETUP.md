# MeatMart Notification System Setup Guide
## WhatsApp Business Platform (Cloud API) & Gmail / SMTP Integration

This document outlines the step-by-step setup for configuring official WhatsApp Business Cloud API messaging, Gmail / Transactional Email SMTP, secure OTP authentication, and webhook delivery tracking for **MeatMart** (Kanjikovil, Erode District, Tamil Nadu).

---

## 1. Architecture Overview

MeatMart incorporates a multi-channel notification dispatcher:
- **Mobile OTP & Delivery Tracking**: Meta WhatsApp Business Cloud API (`v20.0`) with automatic fallback to SMS.
- **Transactional Invoices & Receipts**: Nodemailer SMTP (Gmail, SendGrid, Amazon SES) with branded HTML templates.
- **Real-Time Client Updates**: Socket.IO bi-directional WebSocket rooms (`order:${orderId}` and `user:${userId}`).
- **Local Dev Simulator**: When API credentials are not set, all notifications and OTP codes are safely formatted and recorded in memory/database for zero-blocker testing.

---

## 2. Meta WhatsApp Business Cloud API Setup

### Step A: Create Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com) and log in.
2. Click **My Apps** > **Create App**.
3. Select **Other** > **Business** app type.
4. Set App Name to `MeatMart Notifications` and select your Meta Business Account.

### Step B: Configure WhatsApp Product
1. Under Add Products, find **WhatsApp** and click **Set Up**.
2. Go to **WhatsApp > API Setup** in the left sidebar:
   - Note down the **Phone Number ID** (e.g. `102938475610293`).
   - Note down the **WhatsApp Business Account ID** (e.g. `109283746501928`).
   - Generate a **System User Access Token** with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.

### Step C: Register a Verified Business Phone Number
1. Under **WhatsApp > API Setup > Step 5 (Add a phone number)**:
   - Enter your MeatMart Kanjikovil business phone number (e.g. `+91 98427 12345`).
   - Verify ownership via 6-digit SMS or Voice call.
   - Set Business Profile:
     - Name: `MeatMart Fresh Meats & Masalas`
     - Category: `Grocery & Food Delivery`
     - Address: `Main Road, Kanjikovil, Erode 638116, Tamil Nadu`
     - Description: `Fresh farm-cut chicken & authentic Sakthi masalas delivered in 45 minutes.`

### Step D: Register Message Templates in Meta Business Manager
Navigate to **WhatsApp Manager > Account tools > Message Templates** and create:

1. **OTP Authentication Template**: `meatmart_otp_verification`
   - Category: `AUTHENTICATION`
   - Content: `{{1}} is your MeatMart verification code. Valid for 5 minutes. Do not share this code.`

2. **Order Confirmation**: `meatmart_order_confirmed`
   - Category: `UTILITY`
   - Content: `Hello {{1}}, your MeatMart order #{{2}} for Rs.{{3}} has been confirmed. Track your delivery at {{4}}.`

3. **Out for Delivery**: `meatmart_out_for_delivery`
   - Category: `UTILITY`
   - Content: `Your MeatMart order #{{1}} is out for delivery in Kanjikovil! Delivery OTP: {{2}}. Track live on map: {{3}}.`

4. **Order Delivered**: `meatmart_order_delivered`
   - Category: `UTILITY`
   - Content: `Your MeatMart order #{{1}} has been delivered. Thank you for choosing MeatMart Kanjikovil!`

### Step E: Configure Webhooks
1. In Meta App Dashboard, navigate to **WhatsApp > Configuration > Webhook**.
2. Click **Edit**:
   - **Callback URL**: `https://api.yourdomain.com/api/webhooks/whatsapp`
   - **Verify Token**: `meatmart_kanjikovil_verify_token_2026` (Matches `WHATSAPP_VERIFY_TOKEN` in `.env`).
3. Click **Verify and Save**.
4. In Webhook fields, subscribe to **`messages`**.

---

## 3. Transactional Email Setup (Gmail SMTP & Custom Domain)

### Option A: Gmail SMTP with App Passwords
1. Open Google Account Security: [myaccount.google.com/security](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned ON.
3. Search for **App passwords**.
4. Create an App password:
   - App name: `MeatMart Backend`
   - Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).
5. Update `server/.env`:
   ```env
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="support@meatmartkanjikovil.in"
   SMTP_PASS="abcdefghijklmnop"
   SMTP_FROM='"MeatMart Fresh Kanjikovil" <support@meatmartkanjikovil.in>'
   ```

### Option B: SendGrid / Amazon SES
For high-volume production deployments:
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="SG.your_sendgrid_api_key..."
SMTP_FROM='"MeatMart Fresh" <orders@meatmart.kanjikovil.in>'
```

### DNS Authentication (SPF, DKIM, DMARC)
Configure these TXT records on your domain DNS:
- **SPF Record**:
  `v=spf1 include:_spf.google.com ~all` (or provider specific)
- **DMARC Record** (`_dmarc.meatmartkanjikovil.in`):
  `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@meatmartkanjikovil.in; pct=100`

---

## 4. API Endpoints Reference

### Authentication & OTP
- `POST /api/auth/send-otp`: Generates cryptographically secure 6-digit OTP, enforces 60s cooldown, hashes with SHA-256, dispatches via WhatsApp.
  ```json
  { "phoneNumber": "9876543210", "purpose": "LOGIN" }
  ```
- `POST /api/auth/verify-otp`: Validates OTP against stored hash, enforces max 3 attempts, invalidates upon success.
  ```json
  { "phoneNumber": "9876543210", "otp": "123456" }
  ```
- `POST /api/auth/send-email-otp`: Sends 6-digit verification code to email inbox.
  ```json
  { "email": "customer@example.com" }
  ```
- `POST /api/auth/verify-email-otp`: Confirms email ownership and sets `isEmailVerified: true`.
  ```json
  { "email": "customer@example.com", "otp": "123456" }
  ```

### Customer Preferences & Notifications
- `GET /api/notifications/preferences`: Get WhatsApp, Email, SMS opt-ins and verification status.
- `PATCH /api/notifications/preferences`: Update toggles (`whatsappOrderUpdates`, `whatsappPromos`, `emailReceipts`, `emailPromos`, `smsAlerts`).
- `GET /api/notifications`: Retrieve in-app bell notification feed.
- `PATCH /api/notifications/:id/read`: Mark notification as read.
- `PATCH /api/notifications/read-all`: Mark all as read.

### Webhook Endpoints
- `GET /api/webhooks/whatsapp`: Meta subscription handshake.
- `POST /api/webhooks/whatsapp`: Delivery status callbacks (`sent`, `delivered`, `read`).
- `POST /api/webhooks/email-provider`: Email provider event callbacks.
- `GET /api/webhooks/logs`: Webhook audit trail.

---

## 5. Security & Compliance Safeguards

1. **No Plaintext Stored**: OTPs are combined with random salts and hashed using SHA-256 before storage.
2. **Replay Protection**: OTP records are marked `isUsed: true` immediately after one verification.
3. **Attempt Throttling**: Verification terminates after 3 invalid attempts.
4. **Resend Cooldown**: Clients are throttled to a minimum 60-second cooldown between requests.
5. **No Secret Leaks**: Passwords, OTPs, and tokens are never returned in production API responses.
6. **WhatsApp Opt-In Compliance**: Order confirmations and tracking messages are utility-only and require customer consent collected during registration.
