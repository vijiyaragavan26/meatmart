import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
} from '../controllers/paymentController';

const router = Router();

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/webhook', handleWebhook);

// Order-specific payment aliases
router.post('/:orderId/initiate', createPaymentOrder);
router.post('/:orderId/verify', verifyPayment);

export default router;
