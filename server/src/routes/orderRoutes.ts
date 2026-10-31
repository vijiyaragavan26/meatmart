import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  cancelOrder,
} from '../controllers/orderController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

router.post('/', optionalAuthenticate, createOrder);
router.get('/', authenticate, getMyOrders);
router.get('/my-orders', authenticate, getMyOrders);
router.get('/:id', authenticate, getOrderById);
router.get('/:id/tracking', getOrderTracking); // Customer and delivery tracking view
router.post('/:id/cancel', authenticate, cancelOrder);

export default router;
