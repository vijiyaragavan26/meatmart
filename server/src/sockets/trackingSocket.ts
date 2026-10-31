import { Server, Socket } from 'socket.io';
import { verifyToken, AuthUser } from '../middleware/auth';
import { memDb, prisma, isPostgresConnected } from '../config/db';
import { calculateHaversineDistance } from '../services/pricingService';

interface ExtendedSocket extends Socket {
  user?: AuthUser;
}

export function setupTrackingSockets(io: Server) {
  // Socket.IO authentication middleware
  io.use((socket: ExtendedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (token) {
      const user = verifyToken(token);
      if (user) {
        socket.user = user;
      }
    }
    next();
  });

  io.on('connection', (socket: ExtendedSocket) => {
    console.log(`[Socket] Client connected: ${socket.id}, User: ${socket.user?.fullName || 'Anonymous'}`);

    // Join room for order tracking
    socket.on('join:order-tracking', async (orderId: string) => {
      if (!orderId) return;

      socket.join(`order:${orderId}`);
      console.log(`[Socket] ${socket.id} joined order room: order:${orderId}`);

      // Send initial tracking snapshot immediately
      const trackingData = await getOrderTrackingSnapshot(orderId);
      if (trackingData) {
        socket.emit('tracking:initial-state', trackingData);
      }
    });

    // Leave order room
    socket.on('leave:order-tracking', (orderId: string) => {
      socket.leave(`order:${orderId}`);
      console.log(`[Socket] ${socket.id} left order room: order:${orderId}`);
    });

    // Delivery Partner joins delivery channel
    socket.on('join:delivery-channel', (deliveryPartnerId: string) => {
      if (socket.user?.role === 'DELIVERY_PARTNER' || socket.user?.role === 'ADMIN') {
        socket.join(`delivery-partner:${deliveryPartnerId}`);
        console.log(`[Socket] Delivery partner joined: delivery-partner:${deliveryPartnerId}`);
      }
    });

    // Handle live GPS coordinates streamed from Delivery Partner
    socket.on('delivery:update-location', async (data: {
      orderId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
    }) => {
      try {
        const { orderId, latitude, longitude, heading, speed, accuracy } = data;

        if (!orderId || !latitude || !longitude) return;

        // Verify active assignment
        let order: any = null;
        let partner: any = null;

        if (isPostgresConnected) {
          order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { deliveryAddress: true, deliveryAssignments: { include: { deliveryPartner: { include: { user: true } } } } },
          });
        } else {
          order = memDb.orders.find(o => o.id === orderId);
        }

        if (!order) return;

        // Security check: Only track active orders
        const activeStatuses = ['OUT_FOR_DELIVERY', 'ARRIVING_SOON', 'PICKED_UP'];
        if (!activeStatuses.includes(order.status)) {
          // Delivery completed or cancelled - reject / ignore GPS broadcast and stop sharing
          socket.emit('delivery:stop-location-sharing', {
            orderId,
            reason: order.status,
          });
          return;
        }

        // Calculate remaining distance to customer
        let remainingDistanceKm = 0;
        let estimatedMinutes = 5;

        if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
          const custLat = Number(order.deliveryAddress.latitude);
          const custLng = Number(order.deliveryAddress.longitude);
          remainingDistanceKm = calculateHaversineDistance(latitude, longitude, custLat, custLng);

          // Assuming average city speed of 25 km/h for bike delivery in Kanjikovil / Erode
          estimatedMinutes = Math.max(1, Math.round((remainingDistanceKm / 25) * 60));
        }

        // Auto transition to ARRIVING SOON when within 500 meters
        let updatedStatus = order.status;
        if (remainingDistanceKm > 0 && remainingDistanceKm <= 0.5 && order.status === 'OUT_FOR_DELIVERY') {
          updatedStatus = 'ARRIVING_SOON';
          order.status = 'ARRIVING_SOON';
          io.to(`order:${orderId}`).emit('tracking:status-changed', {
            orderId,
            status: 'ARRIVING_SOON',
            message: 'Your MeatMart delivery partner is arriving soon at your doorstep!',
          });
        }

        // Update partner location in memory / DB
        const locationPayload = {
          orderId,
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 10,
          recordedAt: new Date().toISOString(),
          remainingDistanceKm,
          estimatedMinutes,
          isDemo: Boolean((data as any).isDemo),
        };

        if (!isPostgresConnected) {
          const dp = memDb.deliveryPartners.find(p => p.id === order.deliveryAssignments?.[0]?.deliveryPartnerId);
          if (dp) {
            dp.currentLatitude = latitude;
            dp.currentLongitude = longitude;
            dp.lastLocationUpdate = new Date().toISOString();
          }
        }

        // Broadcast to customer tracking room
        io.to(`order:${orderId}`).emit('tracking:location-updated', locationPayload);
      } catch (err) {
        console.error('[Socket] Error updating delivery location:', err);
      }
    });

    // Handle live GPS coordinates shared by Customer Phone
    socket.on('customer:update-location', async (data: {
      orderId: string;
      latitude: number;
      longitude: number;
      accuracy?: number;
    }) => {
      try {
        const { orderId, latitude, longitude, accuracy } = data;
        if (!orderId || !latitude || !longitude) return;

        let order: any = null;
        if (isPostgresConnected) {
          order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { deliveryAddress: true },
          });
        } else {
          order = memDb.orders.find(o => o.id === orderId);
        }

        if (!order) return;

        // Update customer live coordinates on order
        if (order.deliveryAddress) {
          order.deliveryAddress.latitude = latitude;
          order.deliveryAddress.longitude = longitude;
          order.deliveryAddress.isLiveGps = true;
          order.deliveryAddress.lastGpsUpdate = new Date().toISOString();
        }

        const customerPayload = {
          orderId,
          latitude,
          longitude,
          accuracy: accuracy || 10,
          isLiveGps: true,
          updatedAt: new Date().toISOString(),
        };

        // Broadcast updated customer location to the order room (driver and tracking page)
        io.to(`order:${orderId}`).emit('tracking:customer-location-updated', customerPayload);
        console.log(`[Socket] Customer live location shared for order ${orderId}: (${latitude}, ${longitude})`);
      } catch (err) {
        console.error('[Socket] Error updating customer live location:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

// Helper to assemble full order tracking snapshot
export async function getOrderTrackingSnapshot(orderId: string) {
  let order: any = null;
  let settings: any = null;

  if (isPostgresConnected) {
    try {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          deliveryAddress: true,
          items: true,
          deliveryAssignments: {
            include: {
              deliveryPartner: {
                include: { user: true },
              },
            },
          },
        },
      });
      settings = await prisma.storeSettings.findFirst();
    } catch (e) {
      order = memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
      settings = memDb.storeSettings;
    }
  } else {
    order = memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
    settings = memDb.storeSettings;
  }
  if (!order) {
    order = memDb.orders.find(o => o.id === orderId || o.orderNumber === orderId);
  }

  if (!order) return null;

  const assignment = order.deliveryAssignments?.[0];
  const partner = assignment?.deliveryPartner;

  // Compute status timeline
  const allStatuses = [
    { status: 'ORDER_PLACED', label: 'Order Placed' },
    { status: 'ORDER_ACCEPTED', label: 'Order Accepted' },
    { status: 'PREPARING', label: 'Preparing Fresh Meat' },
    { status: 'PACKED', label: 'Hygienically Packed' },
    { status: 'DELIVERY_PARTNER_ASSIGNED', label: 'Delivery Partner Assigned' },
    { status: 'PICKED_UP', label: 'Order Picked Up' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { status: 'ARRIVING_SOON', label: 'Arriving Soon' },
    { status: 'DELIVERED', label: 'Delivered' },
  ];

  const currentStatusIndex = allStatuses.findIndex(s => s.status === order.status);
  const statusTimeline = allStatuses.map((s, idx) => ({
    status: s.status,
    label: s.label,
    completed: currentStatusIndex >= idx || order.status === 'DELIVERED',
    isCurrent: s.status === order.status,
  }));

  // Calculate distance & ETA
  let remainingDistanceKm = null;
  let estimatedArrivalMinutes = null;

  if (partner?.currentLatitude && partner?.currentLongitude && order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
    remainingDistanceKm = calculateHaversineDistance(
      Number(partner.currentLatitude),
      Number(partner.currentLongitude),
      Number(order.deliveryAddress.latitude),
      Number(order.deliveryAddress.longitude)
    );
    estimatedArrivalMinutes = Math.max(2, Math.round((remainingDistanceKm / 25) * 60));
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    deliverySlot: order.deliverySlot,
    deliveryAddress: order.deliveryAddress,
    storeLocation: {
      name: settings?.storeName || 'MeatMart Kanjikovil',
      address: settings?.storeAddress || 'Main Road, Kanjikovil, Erode - 638116',
      latitude: Number(settings?.storeLatitude || 11.3925317),
      longitude: Number(settings?.storeLongitude || 77.6085870),
      phone: settings?.storePhone || '+91 76049 06429',
    },
    deliveryPartner: partner
      ? {
          id: partner.id,
          fullName: partner.user?.fullName || 'Poopesh',
          phoneNumber: partner.user?.phoneNumber || '+91 93607 61595',
          vehicleType: partner.vehicleType || 'Bike',
          vehicleNumber: partner.vehicleNumber || 'TN 33 BM 7890',
          avatarUrl: partner.user?.avatarUrl || null,
          rating: Number(partner.rating || 4.9),
          currentLocation: partner.currentLatitude
            ? {
                latitude: Number(partner.currentLatitude),
                longitude: Number(partner.currentLongitude),
                recordedAt: partner.lastLocationUpdate || new Date().toISOString(),
              }
            : null,
        }
      : null,
    estimatedArrivalMinutes,
    remainingDistanceKm,
    statusTimeline,
    proofOfDeliveryOtp: order.proofOfDeliveryOtp,
    totalAmount: Number(order.totalAmount),
    items: order.items || [],
  };
}
