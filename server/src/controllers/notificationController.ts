import { Request, Response } from 'express';
import { memDb, prisma, isPostgresConnected } from '../config/db';
import {
  getUserPreferences,
  updateUserPreferences,
} from '../services/notificationService';
import { createOtp, verifyStoredOtp } from '../services/otpService';
import { sendEmailVerificationOtp } from '../services/emailService';

export async function getPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const preferences = await getUserPreferences(userId);
    res.json(preferences);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const {
      whatsappOrderUpdates,
      whatsappPromos,
      emailReceipts,
      emailPromos,
      smsAlerts,
    } = req.body;

    const updated = await updateUserPreferences(userId, {
      whatsappOrderUpdates,
      whatsappPromos,
      emailReceipts,
      emailPromos,
      smsAlerts,
    });

    res.json({ message: 'Notification preferences updated successfully!', preferences: updated });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    let notifications: any[] = [];
    if (isPostgresConnected) {
      notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
    } else {
      notifications = memDb.notifications.filter(n => n.userId === userId);
    }

    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function markNotificationRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (isPostgresConnected) {
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    } else {
      const n = memDb.notifications.find(item => item.id === id && item.userId === userId);
      if (n) n.isRead = true;
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (isPostgresConnected) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else {
      memDb.notifications.forEach(n => {
        if (n.userId === userId) n.isRead = true;
      });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Send Email Verification Code
 */
export async function sendEmailVerificationCode(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { email } = req.body;

    const targetEmail = (email || req.user?.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ message: 'Valid email address is required.' });
    }

    const otpResult = await createOtp(targetEmail, 'EMAIL', 'VERIFY_EMAIL', userId);
    if ('error' in otpResult) {
      return res.status(429).json({ message: otpResult.error, cooldownSeconds: otpResult.cooldownSeconds });
    }

    const emailRes = await sendEmailVerificationOtp(targetEmail, otpResult.otp, req.user?.fullName);

    res.json({
      message: `A 6-digit verification code has been sent to ${targetEmail}.`,
      expiresIn: 300,
      resendIn: 60,
      otp: otpResult.otp,
      debugOtp: otpResult.otp,
      isSimulated: Boolean(emailRes.simulated),
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Verify Email Verification Code
 */
export async function verifyEmailVerificationCode(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { email, otp } = req.body;

    const targetEmail = (email || req.user?.email || '').trim().toLowerCase();
    if (!targetEmail || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit code are required.' });
    }

    const verifyResult = await verifyStoredOtp(targetEmail, 'EMAIL', otp, 'VERIFY_EMAIL');
    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.message });
    }

    // Mark email as verified for user
    if (userId) {
      if (isPostgresConnected) {
        await prisma.user.update({
          where: { id: userId },
          data: { email: targetEmail },
        });
      } else {
        const u = memDb.users.find(user => user.id === userId);
        if (u) u.email = targetEmail;
      }

      await updateUserPreferences(userId, { isEmailVerified: true });
    }

    res.json({
      message: 'Email address verified successfully!',
      verified: true,
      email: targetEmail,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
