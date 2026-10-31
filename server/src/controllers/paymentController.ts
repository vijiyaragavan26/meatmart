import { Request, Response } from 'express';
import crypto from 'crypto';
import { memDb } from '../config/db';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_sampleKey123';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'sampleSecretKey456';

export async function createPaymentOrder(req: Request, res: Response) {
  try {
    const orderIdParam = req.params.orderId;
    const { amount, currency = 'INR', orderId = orderIdParam, gateway = 'ONLINE' } = req.body;

    let targetAmount = amount;
    let targetOrder: any = null;
    if (orderId) {
      targetOrder = memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
      if (targetOrder && !targetAmount) {
        targetAmount = targetOrder.totalAmount;
      }
    }

    if (!targetAmount || targetAmount <= 0) {
      targetAmount = 250;
    }

    const gatewayOrderId = `ord_pay_${crypto.randomBytes(8).toString('hex')}`;
    const upiVpa = 'meatmart.kanjikovil@okhdfcbank';
    const upiLink = `upi://pay?pa=${upiVpa}&pn=MeatMart%20Kanjikovil&am=${targetAmount}&cu=INR&tn=Order%20${targetOrder?.orderNumber || gatewayOrderId}`;

    res.json({
      success: true,
      gatewayOrderId,
      gateway,
      amount: Math.round(targetAmount * 100), // amount in paise
      currency,
      upiVpa,
      upiLink,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const orderIdParam = req.params.orderId;
    const {
      orderId = orderIdParam,
      gatewayOrderId,
      gatewayPaymentId,
      gatewaySignature,
      gateway = 'ONLINE',
    } = req.body;

    const targetOrderId = orderId || orderIdParam;

    // Update order status if orderId provided
    if (targetOrderId) {
      const order = memDb.orders.find(o => o.id === targetOrderId || o.orderNumber === targetOrderId);
      if (order) {
        order.paymentStatus = 'SUCCESS';
        if (gateway) {
          order.paymentMethod = gateway;
        }
        order.status = 'PAYMENT_CONFIRMED';
        order.updatedAt = new Date().toISOString();
      }
    }

    const confirmedOrder = targetOrderId ? memDb.orders.find(o => o.id === targetOrderId || o.orderNumber === targetOrderId) : null;

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully!',
      order: confirmedOrder,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  // Webhook listener for asynchronous payment notifications from gateway
  const secret = RAZORPAY_KEY_SECRET;
  const signature = req.headers['x-razorpay-signature'] as string;

  if (signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expected) {
      return res.status(400).send('Invalid webhook signature');
    }
  }

  // Acknowledge receipt
  res.status(200).json({ status: 'ok' });
}
