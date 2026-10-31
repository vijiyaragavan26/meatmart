import { Router } from 'express';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  resetPassword,
  getMe,
  addAddress,
} from '../controllers/authController';
import {
  sendEmailVerificationCode,
  verifyEmailVerificationCode,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/send-email-otp', sendEmailVerificationCode);
router.post('/verify-email-otp', verifyEmailVerificationCode);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);
router.post('/addresses', authenticate, addAddress);

export default router;
