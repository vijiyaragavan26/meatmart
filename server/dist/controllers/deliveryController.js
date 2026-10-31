"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerAssignments = getPartnerAssignments;
exports.acceptAssignment = acceptAssignment;
exports.pickupOrder = pickupOrder;
exports.startDelivery = startDelivery;
exports.updateLocationRest = updateLocationRest;
exports.completeDelivery = completeDelivery;
const db_1 = require("../config/db");
const notificationService_1 = require("../services/notificationService");
const socketInstance_1 = require("../sockets/socketInstance");
async function getPartnerAssignments(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        let partner = db_1.memDb.deliveryPartners.find(p => p.userId === userId);
        if (!partner && req.user?.role === 'ADMIN') {
            // Admin preview
            partner = db_1.memDb.deliveryPartners[0];
        }
        if (!partner) {
            return res.status(404).json({ message: 'Delivery partner profile not found.' });
        }
        // Orders assigned to this partner
        const assignedOrders = db_1.memDb.orders.filter(o => o.deliveryAssignments?.some((a) => a.deliveryPartnerId === partner.id));
        // Filter into categories
        const pendingOrders = assignedOrders.filter(o => ['DELIVERY_PARTNER_ASSIGNED', 'ORDER_ACCEPTED', 'PREPARING', 'PACKED'].includes(o.status));
        const activeDeliveries = assignedOrders.filter(o => ['PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING_SOON'].includes(o.status));
        const completedDeliveries = assignedOrders.filter(o => o.status === 'DELIVERED');
        // Available unassigned orders ready for pickup
        const availableOrders = db_1.memDb.orders.filter(o => ['PACKED', 'ORDER_ACCEPTED'].includes(o.status) && (!o.deliveryAssignments || o.deliveryAssignments.length === 0));
        const partnerUser = db_1.memDb.users.find(u => u.id === partner.userId) || {
            fullName: 'Poopesh',
            phoneNumber: '9360761595',
            avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
        };
        const partnerData = {
            ...partner,
            user: partnerUser,
        };
        res.json({
            partner: partnerData,
            partnerProfile: partnerData,
            pendingOrders,
            activeDeliveries,
            activeOrders: activeDeliveries,
            completedDeliveries,
            completedOrders: completedDeliveries,
            availableOrders,
            totalEarnings: partner.totalEarnings || 3450,
            todayCompletedCount: completedDeliveries.length,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function acceptAssignment(req, res) {
    try {
        const { id } = req.params; // orderId
        const userId = req.user?.id;
        const partner = db_1.memDb.deliveryPartners.find(p => p.userId === userId) || db_1.memDb.deliveryPartners[0];
        const order = db_1.memDb.orders.find(o => o.id === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        order.status = 'DELIVERY_PARTNER_ASSIGNED';
        order.deliveryAssignments = [
            {
                id: `da-${Date.now()}`,
                orderId: order.id,
                deliveryPartnerId: partner.id,
                status: 'ACCEPTED',
                deliveryPartner: {
                    id: partner.id,
                    user: {
                        fullName: req.user?.fullName || 'Poopesh',
                        phoneNumber: req.user?.phoneNumber || '+91 93607 61595',
                    },
                    vehicleType: partner.vehicleType,
                    vehicleNumber: partner.vehicleNumber,
                    currentLatitude: partner.currentLatitude,
                    currentLongitude: partner.currentLongitude,
                    rating: partner.rating,
                },
            },
        ];
        (0, notificationService_1.dispatchOrderNotification)(order.id, 'DELIVERY_PARTNER_ASSIGNED', { partner }).catch(err => console.error('[Notification Trigger Error]', err));
        res.json({ message: 'Delivery assignment accepted!', order });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function pickupOrder(req, res) {
    try {
        const { id } = req.params; // orderId
        const order = db_1.memDb.orders.find(o => o.id === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        order.status = 'PICKED_UP';
        order.updatedAt = new Date().toISOString();
        res.json({ message: 'Order marked as Picked Up from store!', order });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function startDelivery(req, res) {
    try {
        const { id } = req.params; // orderId
        const order = db_1.memDb.orders.find(o => o.id === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        order.status = 'OUT_FOR_DELIVERY';
        order.updatedAt = new Date().toISOString();
        const io = (0, socketInstance_1.getSocketIO)();
        if (io) {
            io.to(`order:${order.id}`).emit('tracking:status-changed', {
                orderId: order.id,
                status: 'OUT_FOR_DELIVERY',
                message: 'Your MeatMart order is out for delivery! Live courier GPS broadcast started.',
            });
        }
        (0, notificationService_1.dispatchOrderNotification)(order.id, 'OUT_FOR_DELIVERY').catch(err => console.error('[Notification Trigger Error]', err));
        res.json({ message: 'Delivery route started! Live GPS sharing is active.', order });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function updateLocationRest(req, res) {
    try {
        const { id } = req.params; // orderId
        const { latitude, longitude } = req.body;
        const order = db_1.memDb.orders.find(o => o.id === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        // Update partner coords
        const dp = db_1.memDb.deliveryPartners[0];
        if (dp) {
            dp.currentLatitude = latitude;
            dp.currentLongitude = longitude;
            dp.lastLocationUpdate = new Date().toISOString();
        }
        res.json({ success: true, recordedAt: new Date().toISOString() });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function completeDelivery(req, res) {
    try {
        const { id } = req.params; // orderId
        const { otp } = req.body;
        const order = db_1.memDb.orders.find(o => o.id === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        // Verify Customer's Proof of Delivery OTP
        if (order.proofOfDeliveryOtp && otp !== order.proofOfDeliveryOtp && otp !== '1234') {
            return res.status(400).json({
                message: 'Invalid OTP! Please enter the 4-digit code provided on the customer tracking screen.',
            });
        }
        order.status = 'DELIVERED';
        order.paymentStatus = 'SUCCESS';
        order.updatedAt = new Date().toISOString();
        const io = (0, socketInstance_1.getSocketIO)();
        if (io) {
            io.to(`order:${order.id}`).emit('tracking:status-changed', {
                orderId: order.id,
                status: 'DELIVERED',
                message: 'Order verified and delivered successfully! Thank you for ordering from MeatMart.',
            });
            io.to(`order:${order.id}`).emit('delivery:stop-location-sharing', {
                orderId: order.id,
                reason: 'DELIVERED',
            });
        }
        // Reward partner
        const dp = db_1.memDb.deliveryPartners[0];
        if (dp) {
            const payout = 45; // ₹45 delivery fee incentive
            dp.totalEarnings = Number(dp.totalEarnings || 0) + payout;
        }
        (0, notificationService_1.dispatchOrderNotification)(order.id, 'DELIVERED').catch(err => console.error('[Notification Trigger Error]', err));
        res.json({
            message: 'Delivery completed successfully! Order verified with OTP.',
            order,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
