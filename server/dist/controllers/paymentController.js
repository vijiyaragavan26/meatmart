"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentOrder = createPaymentOrder;
exports.verifyPayment = verifyPayment;
exports.handleWebhook = handleWebhook;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_sampleKey123';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'sampleSecretKey456';
async function createPaymentOrder(req, res) {
    try {
        const orderIdParam = req.params.orderId;
        const { amount, currency = 'INR', orderId = orderIdParam, gateway = 'ONLINE' } = req.body;
        let targetAmount = amount;
        let targetOrder = null;
        if (orderId) {
            targetOrder = db_1.memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
            if (targetOrder && !targetAmount) {
                targetAmount = targetOrder.totalAmount;
            }
        }
        if (!targetAmount || targetAmount <= 0) {
            targetAmount = 250;
        }
        const gatewayOrderId = `ord_pay_${crypto_1.default.randomBytes(8).toString('hex')}`;
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
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function verifyPayment(req, res) {
    try {
        const orderIdParam = req.params.orderId;
        const { orderId = orderIdParam, gatewayOrderId, gatewayPaymentId, gatewaySignature, gateway = 'ONLINE', } = req.body;
        const targetOrderId = orderId || orderIdParam;
        // Update order status if orderId provided
        if (targetOrderId) {
            const order = db_1.memDb.orders.find(o => o.id === targetOrderId || o.orderNumber === targetOrderId);
            if (order) {
                order.paymentStatus = 'SUCCESS';
                if (gateway) {
                    order.paymentMethod = gateway;
                }
                order.status = 'PAYMENT_CONFIRMED';
                order.updatedAt = new Date().toISOString();
            }
        }
        const confirmedOrder = targetOrderId ? db_1.memDb.orders.find(o => o.id === targetOrderId || o.orderNumber === targetOrderId) : null;
        res.json({
            success: true,
            message: 'Payment verified and confirmed successfully!',
            order: confirmedOrder,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function handleWebhook(req, res) {
    // Webhook listener for asynchronous payment notifications from gateway
    const secret = RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    if (signature) {
        const expected = crypto_1.default
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
