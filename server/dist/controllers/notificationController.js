"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
exports.getNotifications = getNotifications;
exports.markNotificationRead = markNotificationRead;
exports.markAllNotificationsRead = markAllNotificationsRead;
exports.sendEmailVerificationCode = sendEmailVerificationCode;
exports.verifyEmailVerificationCode = verifyEmailVerificationCode;
const db_1 = require("../config/db");
const notificationService_1 = require("../services/notificationService");
const otpService_1 = require("../services/otpService");
const emailService_1 = require("../services/emailService");
async function getPreferences(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const preferences = await (0, notificationService_1.getUserPreferences)(userId);
        res.json(preferences);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function updatePreferences(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const { whatsappOrderUpdates, whatsappPromos, emailReceipts, emailPromos, smsAlerts, } = req.body;
        const updated = await (0, notificationService_1.updateUserPreferences)(userId, {
            whatsappOrderUpdates,
            whatsappPromos,
            emailReceipts,
            emailPromos,
            smsAlerts,
        });
        res.json({ message: 'Notification preferences updated successfully!', preferences: updated });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function getNotifications(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        let notifications = [];
        if (db_1.isPostgresConnected) {
            notifications = await db_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
            });
        }
        else {
            notifications = db_1.memDb.notifications.filter(n => n.userId === userId);
        }
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function markNotificationRead(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (db_1.isPostgresConnected) {
            await db_1.prisma.notification.updateMany({
                where: { id, userId },
                data: { isRead: true },
            });
        }
        else {
            const n = db_1.memDb.notifications.find(item => item.id === id && item.userId === userId);
            if (n)
                n.isRead = true;
        }
        res.json({ message: 'Notification marked as read' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function markAllNotificationsRead(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        if (db_1.isPostgresConnected) {
            await db_1.prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
        }
        else {
            db_1.memDb.notifications.forEach(n => {
                if (n.userId === userId)
                    n.isRead = true;
            });
        }
        res.json({ message: 'All notifications marked as read' });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
/**
 * Send Email Verification Code
 */
async function sendEmailVerificationCode(req, res) {
    try {
        const userId = req.user?.id;
        const { email } = req.body;
        const targetEmail = (email || req.user?.email || '').trim().toLowerCase();
        if (!targetEmail || !targetEmail.includes('@')) {
            return res.status(400).json({ message: 'Valid email address is required.' });
        }
        const otpResult = await (0, otpService_1.createOtp)(targetEmail, 'EMAIL', 'VERIFY_EMAIL', userId);
        if ('error' in otpResult) {
            return res.status(429).json({ message: otpResult.error, cooldownSeconds: otpResult.cooldownSeconds });
        }
        const emailRes = await (0, emailService_1.sendEmailVerificationOtp)(targetEmail, otpResult.otp, req.user?.fullName);
        res.json({
            message: `A 6-digit verification code has been sent to ${targetEmail}.`,
            expiresIn: 300,
            resendIn: 60,
            otp: otpResult.otp,
            debugOtp: otpResult.otp,
            isSimulated: Boolean(emailRes.simulated),
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
/**
 * Verify Email Verification Code
 */
async function verifyEmailVerificationCode(req, res) {
    try {
        const userId = req.user?.id;
        const { email, otp } = req.body;
        const targetEmail = (email || req.user?.email || '').trim().toLowerCase();
        if (!targetEmail || !otp) {
            return res.status(400).json({ message: 'Email and 6-digit code are required.' });
        }
        const verifyResult = await (0, otpService_1.verifyStoredOtp)(targetEmail, 'EMAIL', otp, 'VERIFY_EMAIL');
        if (!verifyResult.success) {
            return res.status(400).json({ message: verifyResult.message });
        }
        // Mark email as verified for user
        if (userId) {
            if (db_1.isPostgresConnected) {
                await db_1.prisma.user.update({
                    where: { id: userId },
                    data: { email: targetEmail },
                });
            }
            else {
                const u = db_1.memDb.users.find(user => user.id === userId);
                if (u)
                    u.email = targetEmail;
            }
            await (0, notificationService_1.updateUserPreferences)(userId, { isEmailVerified: true });
        }
        res.json({
            message: 'Email address verified successfully!',
            verified: true,
            email: targetEmail,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
