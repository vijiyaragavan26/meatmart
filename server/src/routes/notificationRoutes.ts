import { Router } from 'express';
import {
  getPreferences,
  updatePreferences,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  sendEmailVerificationCode,
  verifyEmailVerificationCode,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);
router.patch('/read-all', markAllNotificationsRead);

router.post('/send-email-otp', sendEmailVerificationCode);
router.post('/verify-email-otp', verifyEmailVerificationCode);

export default router;
