"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPreferences = getUserPreferences;
exports.updateUserPreferences = updateUserPreferences;
exports.createInAppNotification = createInAppNotification;
exports.dispatchOrderNotification = dispatchOrderNotification;
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const socketInstance_1 = require("../sockets/socketInstance");
const whatsappService = __importStar(require("./whatsappService"));
const emailService = __importStar(require("./emailService"));
/**
 * Fetch or initialize customer's notification preferences
 */
async function getUserPreferences(userId) {
    if (db_1.isPostgresConnected) {
        let pref = await db_1.prisma.notificationPreference.findUnique({ where: { userId } });
        if (!pref) {
            const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
            pref = await db_1.prisma.notificationPreference.create({
                data: {
                    userId,
                    whatsappOrderUpdates: true,
                    whatsappPromos: false,
                    emailReceipts: true,
                    emailPromos: false,
                    smsAlerts: true,
                    isEmailVerified: Boolean(user?.email),
                    isPhoneVerified: true,
                },
            });
        }
        return {
            ...pref,
            updatedAt: pref.updatedAt.toISOString(),
        };
    }
    let memPref = db_1.memDb.notificationPreferences.find(p => p.userId === userId);
    if (!memPref) {
        const user = db_1.memDb.users.find(u => u.id === userId);
        memPref = {
            id: `pref-${userId}`,
            userId,
            whatsappOrderUpdates: true,
            whatsappPromos: false,
            emailReceipts: true,
            emailPromos: false,
            smsAlerts: true,
            isEmailVerified: Boolean(user?.email),
            isPhoneVerified: true,
            updatedAt: new Date().toISOString(),
        };
        db_1.memDb.notificationPreferences.push(memPref);
    }
    return memPref;
}
/**
 * Update notification preferences
 */
async function updateUserPreferences(userId, updates) {
    if (db_1.isPostgresConnected) {
        const updated = await db_1.prisma.notificationPreference.upsert({
            where: { userId },
            update: {
                ...(updates.whatsappOrderUpdates !== undefined ? { whatsappOrderUpdates: updates.whatsappOrderUpdates } : {}),
                ...(updates.whatsappPromos !== undefined ? { whatsappPromos: updates.whatsappPromos } : {}),
                ...(updates.emailReceipts !== undefined ? { emailReceipts: updates.emailReceipts } : {}),
                ...(updates.emailPromos !== undefined ? { emailPromos: updates.emailPromos } : {}),
                ...(updates.smsAlerts !== undefined ? { smsAlerts: updates.smsAlerts } : {}),
                ...(updates.isEmailVerified !== undefined ? { isEmailVerified: updates.isEmailVerified } : {}),
            },
            create: {
                userId,
                whatsappOrderUpdates: updates.whatsappOrderUpdates ?? true,
                whatsappPromos: updates.whatsappPromos ?? false,
                emailReceipts: updates.emailReceipts ?? true,
                emailPromos: updates.emailPromos ?? false,
                smsAlerts: updates.smsAlerts ?? true,
                isEmailVerified: updates.isEmailVerified ?? false,
                isPhoneVerified: true,
            },
        });
        return {
            ...updated,
            updatedAt: updated.updatedAt.toISOString(),
        };
    }
    const pref = await getUserPreferences(userId);
    Object.assign(pref, updates, { updatedAt: new Date().toISOString() });
    return pref;
}
/**
 * Create In-App Notification (Bell icon feed)
 */
async function createInAppNotification(userId, title, message, type, dataJson) {
    const notif = {
        id: `notif-app-${(0, uuid_1.v4)().substring(0, 8)}`,
        userId,
        title,
        message,
        type,
        dataJson: dataJson ? JSON.stringify(dataJson) : null,
        isRead: false,
        createdAt: new Date().toISOString(),
    };
    if (db_1.isPostgresConnected) {
        await db_1.prisma.notification.create({
            data: {
                id: notif.id,
                userId: notif.userId,
                title: notif.title,
                message: notif.message,
                type: notif.type,
                dataJson: notif.dataJson,
            },
        });
    }
    else {
        db_1.memDb.notifications.unshift(notif);
    }
    // Real-time push via socket to user
    const io = (0, socketInstance_1.getSocketIO)();
    if (io) {
        io.to(`user:${userId}`).emit('notification:new', notif);
    }
    return notif;
}
/**
 * Central Order Lifecycle Notification Trigger
 */
async function dispatchOrderNotification(orderId, eventType, extraData) {
    try {
        // 1. Fetch Order and User
        let order = null;
        let user = null;
        if (db_1.isPostgresConnected) {
            order = await db_1.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    deliveryAddress: true,
                    items: true,
                    deliveryAssignments: { include: { deliveryPartner: { include: { user: true } } } },
                },
            });
            if (order?.userId) {
                user = await db_1.prisma.user.findUnique({ where: { id: order.userId } });
            }
        }
        else {
            order = db_1.memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
            if (order?.userId) {
                user = db_1.memDb.users.find(u => u.id === order.userId);
            }
        }
        if (!order) {
            console.warn(`[Notification] Order ${orderId} not found. Skipping notifications.`);
            return;
        }
        const userId = order.userId;
        const prefs = userId ? await getUserPreferences(userId) : {
            whatsappOrderUpdates: true,
            emailReceipts: true,
            smsAlerts: true,
        };
        const phoneNumber = user?.phoneNumber || order.deliveryAddress?.recipientPhone;
        const email = user?.email || (phoneNumber?.includes('7604906429') ? 'vijiyaragavan26@gmail.com' : undefined) || 'vijiyaragavan26@gmail.com';
        const liveTrackingUrl = `https://meatmart.kanjikovil.in/tracking/${order.id}`;
        // 2. Dispatch Based on Event Type
        switch (eventType) {
            case 'ORDER_PLACED':
            case 'ORDER_ACCEPTED': {
                const title = 'Order Confirmed!';
                const message = `Your order #${order.orderNumber} (₹${order.totalAmount}) is confirmed and being prepared at MeatMart Kanjikovil.`;
                await createInAppNotification(userId, title, message, 'ORDER_UPDATE', { orderId: order.id });
                if (prefs.whatsappOrderUpdates && phoneNumber) {
                    await whatsappService.sendWhatsAppOrderConfirmed(phoneNumber, order);
                }
                if (prefs.emailReceipts && email) {
                    await emailService.sendOrderConfirmationEmail(email, order, user?.fullName);
                }
                break;
            }
            case 'DELIVERY_PARTNER_ASSIGNED': {
                const partner = extraData?.partner || order.deliveryAssignments?.[0]?.deliveryPartner || db_1.memDb.deliveryPartners[0];
                const partnerName = partner?.user?.fullName || partner?.fullName || 'Poopesh';
                const title = 'Delivery Partner Assigned 🚴';
                const message = `${partnerName} has been assigned to deliver your order #${order.orderNumber}.`;
                await createInAppNotification(userId, title, message, 'DELIVERY_ASSIGNMENT', { orderId: order.id, partnerName });
                if (prefs.whatsappOrderUpdates && phoneNumber) {
                    await whatsappService.sendWhatsAppDriverAssigned(phoneNumber, order, partner);
                }
                if (prefs.emailReceipts && email) {
                    await emailService.sendDriverAssignedEmail(email, order, partner);
                }
                break;
            }
            case 'OUT_FOR_DELIVERY': {
                const title = 'Out for Delivery 🚀';
                const message = `Order #${order.orderNumber} is on the way! Your delivery OTP is ${order.proofOfDeliveryOtp || '4829'}.`;
                await createInAppNotification(userId, title, message, 'ORDER_UPDATE', { orderId: order.id, otp: order.proofOfDeliveryOtp });
                if (prefs.whatsappOrderUpdates && phoneNumber) {
                    await whatsappService.sendWhatsAppOutForDelivery(phoneNumber, order, liveTrackingUrl);
                }
                if (prefs.emailReceipts && email) {
                    await emailService.sendOutForDeliveryEmail(email, order, liveTrackingUrl);
                }
                break;
            }
            case 'ARRIVING_SOON': {
                const title = 'Arriving Soon! 🛵';
                const message = `Your delivery partner is less than 500 meters away from your doorstep.`;
                await createInAppNotification(userId, title, message, 'ORDER_UPDATE', { orderId: order.id });
                break;
            }
            case 'DELIVERED': {
                const title = 'Order Delivered! ✅';
                const message = `Your order #${order.orderNumber} has been safely delivered. Thank you for shopping with MeatMart!`;
                await createInAppNotification(userId, title, message, 'ORDER_UPDATE', { orderId: order.id });
                if (prefs.whatsappOrderUpdates && phoneNumber) {
                    await whatsappService.sendWhatsAppOrderDelivered(phoneNumber, order);
                }
                if (prefs.emailReceipts && email) {
                    await emailService.sendOrderDeliveredEmail(email, order);
                }
                break;
            }
            case 'CANCELLED': {
                const reason = extraData?.reason || order.cancellationReason || 'Cancelled by customer';
                const title = 'Order Cancelled';
                const message = `Order #${order.orderNumber} was cancelled. ${reason}`;
                await createInAppNotification(userId, title, message, 'ORDER_UPDATE', { orderId: order.id, reason });
                if (prefs.whatsappOrderUpdates && phoneNumber) {
                    await whatsappService.sendWhatsAppOrderCancelled(phoneNumber, order, reason);
                }
                if (prefs.emailReceipts && email) {
                    await emailService.sendOrderCancelledEmail(email, order, reason);
                }
                break;
            }
        }
        // 3. Emit real-time tracking update to active socket tracking room
        const io = (0, socketInstance_1.getSocketIO)();
        if (io) {
            io.to(`order:${order.id}`).emit('tracking:status-changed', {
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                updatedAt: new Date().toISOString(),
            });
        }
    }
    catch (err) {
        console.error('[Notification Dispatcher Error]:', err);
    }
}
