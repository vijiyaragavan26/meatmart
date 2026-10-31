import { Router } from 'express';
import {
  getPartnerAssignments,
  acceptAssignment,
  pickupOrder,
  startDelivery,
  updateLocationRest,
  completeDelivery,
} from '../controllers/deliveryController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Delivery partner endpoints protected by role check
router.use(authenticate);
router.use(requireRole(['DELIVERY_PARTNER', 'ADMIN']));

router.get('/assignments', getPartnerAssignments);
router.post('/assignments/:id/accept', acceptAssignment);
router.post('/assignments/:id/pickup', pickupOrder);
router.post('/assignments/:id/start', startDelivery);
router.post('/assignments/:id/location', updateLocationRest);
router.post('/assignments/:id/complete', completeDelivery);

// Compatibility aliases for frontend dashboard actions
router.post('/orders/:id/pickup', pickupOrder);
router.post('/orders/:id/start', startDelivery);
router.post('/orders/:id/complete', completeDelivery);
router.post('/orders/:id/verify-otp', completeDelivery);
router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (status === 'PICKED_UP') {
    return pickupOrder(req, res);
  }
  if (status === 'OUT_FOR_DELIVERY') {
    return startDelivery(req, res);
  }
  if (status === 'DELIVERED') {
    return completeDelivery(req, res);
  }
  return res.status(400).json({ message: `Unsupported status: ${status}` });
});

export default router;
