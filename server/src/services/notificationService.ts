import { v4 as uuidv4 } from 'uuid';
import { memDb, prisma, isPostgresConnected } from '../config/db';
import { getSocketIO } from '../sockets/socketInstance';
import * as whatsappService from './whatsappService';
import * as emailService from './emailService';

export interface UserNotificationPreferences {
  id: string;
  userId: string;
  whatsappOrderUpdates: boolean;
  whatsappPromos: boolean;
  emailReceipts: boolean;
  emailPromos: boolean;
  smsAlerts: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  updatedAt: string;
}

/**
 * Fetch or initialize customer's notification preferences
 */
export async function getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
  if (isPostgresConnected) {
    let pref = await prisma.notificationPreference.findUnique({ where: { userId } });
    if (!pref) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      pref = await prisma.notificationPreference.create({
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

  let memPref = memDb.notificationPreferences.find(p => p.userId === userId);
  if (!memPref) {
    const user = memDb.users.find(u => u.id === userId);
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
    memDb.notificationPreferences.push(memPref);
  }
  return memPref;
}

/**
 * Update notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserNotificationPreferences>
): Promise<UserNotificationPreferences> {
  if (isPostgresConnected) {
    const updated = await prisma.notificationPreference.upsert({
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
export async function createInAppNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  dataJson?: any
) {
  const notif = {
    id: `notif-app-${uuidv4().substring(0, 8)}`,
    userId,
    title,
    message,
    type,
    dataJson: dataJson ? JSON.stringify(dataJson) : null,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  if (isPostgresConnected) {
    await prisma.notification.create({
      data: {
        id: notif.id,
        userId: notif.userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        dataJson: notif.dataJson,
      },
    });
  } else {
    memDb.notifications.unshift(notif);
  }

  // Real-time push via socket to user
  const io = getSocketIO();
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notif);
  }

  return notif;
}

/**
 * Central Order Lifecycle Notification Trigger
 */
export async function dispatchOrderNotification(
  orderId: string,
  eventType: 'ORDER_PLACED' | 'ORDER_ACCEPTED' | 'DELIVERY_PARTNER_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'ARRIVING_SOON' | 'DELIVERED' | 'CANCELLED',
  extraData?: any
) {
  try {
    // 1. Fetch Order and User
    let order: any = null;
    let user: any = null;

    if (isPostgresConnected) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          deliveryAddress: true,
          items: true,
          deliveryAssignments: { include: { deliveryPartner: { include: { user: true } } } },
        },
      });
      if (order?.userId) {
        user = await prisma.user.findUnique({ where: { id: order.userId } });
      }
    } else {
      order = memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
      if (order?.userId) {
        user = memDb.users.find(u => u.id === order.userId);
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
        const partner = extraData?.partner || order.deliveryAssignments?.[0]?.deliveryPartner || memDb.deliveryPartners[0];
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
    const io = getSocketIO();
    if (io) {
      io.to(`order:${order.id}`).emit('tracking:status-changed', {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error('[Notification Dispatcher Error]:', err);
  }
}
