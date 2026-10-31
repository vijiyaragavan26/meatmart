"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getAllOrders = getAllOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.assignDeliveryPartner = assignDeliveryPartner;
exports.getActiveDeliveriesMap = getActiveDeliveriesMap;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.addProductImage = addProductImage;
exports.deleteProductImage = deleteProductImage;
exports.setPrimaryProductImage = setPrimaryProductImage;
exports.toggleProductAvailability = toggleProductAvailability;
exports.getStoreSettings = getStoreSettings;
exports.updateStoreSettings = updateStoreSettings;
exports.getDeliveryZones = getDeliveryZones;
exports.updateDeliveryZone = updateDeliveryZone;
exports.addDeliveryZone = addDeliveryZone;
exports.getDeliverySlots = getDeliverySlots;
exports.getDeliveryPartners = getDeliveryPartners;
exports.addDeliveryPartner = addDeliveryPartner;
exports.getReports = getReports;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const db_1 = require("../config/db");
const notificationService_1 = require("../services/notificationService");
async function getDashboardStats(req, res) {
    try {
        const orders = db_1.memDb.orders;
        const totalOrders = orders.length;
        // Calculate revenue
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
        const totalSales = orders
            .filter(o => o.status !== 'CANCELLED')
            .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
        const pendingOrders = orders.filter(o => ['ORDER_PLACED', 'PAYMENT_CONFIRMED'].includes(o.status)).length;
        const preparingOrders = orders.filter(o => ['ORDER_ACCEPTED', 'PREPARING', 'PACKED'].includes(o.status)).length;
        const activeDeliveries = orders.filter(o => ['DELIVERY_PARTNER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING_SOON'].includes(o.status)).length;
        const completedOrders = deliveredOrders.length;
        const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
        const totalCustomers = db_1.memDb.users.filter(u => u.role === 'CUSTOMER').length;
        const activePartners = db_1.memDb.deliveryPartners.filter(p => p.isOnline).length;
        const lowStockProducts = db_1.memDb.products.filter(p => (p.inventory?.currentStock ?? 10) <= (p.inventory?.lowStockAlert ?? 5)).length;
        res.json({
            totalOrders,
            totalSales,
            todayRevenue: totalSales,
            pendingOrders,
            preparingOrders,
            activeDeliveries,
            completedOrders,
            cancelledOrders,
            totalCustomers,
            activePartners,
            lowStockProducts,
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function getAllOrders(req, res) {
    try {
        const { status, search } = req.query;
        let orders = [...db_1.memDb.orders];
        if (status && status !== 'ALL') {
            orders = orders.filter(o => o.status === status);
        }
        if (search) {
            const q = String(search).toLowerCase();
            orders = orders.filter(o => o.orderNumber.toLowerCase().includes(q) ||
                o.deliveryAddress?.recipientName?.toLowerCase().includes(q) ||
                o.deliveryAddress?.recipientPhone?.includes(q));
        }
        res.json(orders);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function updateOrderStatus(req, res) {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;
        const order = db_1.memDb.orders.find(o => o.id === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        order.status = status;
        order.updatedAt = new Date().toISOString();
        (0, notificationService_1.dispatchOrderNotification)(order.id, status).catch(err => console.error('[Notification Trigger Error]', err));
        res.json({ message: `Order status updated to ${status}`, order });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function assignDeliveryPartner(req, res) {
    try {
        const { id } = req.params; // orderId
        const { partnerId } = req.body;
        const order = db_1.memDb.orders.find(o => o.id === id || o.orderNumber === id);
        if (!order)
            return res.status(404).json({ message: 'Order not found' });
        const partner = db_1.memDb.deliveryPartners.find(p => p.id === partnerId) || db_1.memDb.deliveryPartners[0];
        const partnerUser = db_1.memDb.users.find(u => u.id === partner.userId);
        order.status = 'DELIVERY_PARTNER_ASSIGNED';
        order.deliveryAssignments = [
            {
                id: `da-${Date.now()}`,
                orderId: order.id,
                deliveryPartnerId: partner.id,
                status: 'OFFERED',
                deliveryPartner: {
                    id: partner.id,
                    user: {
                        fullName: partnerUser?.fullName || 'Poopesh',
                        phoneNumber: partnerUser?.phoneNumber || '9360761595',
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
        res.json({ message: 'Delivery partner assigned successfully!', order });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function getActiveDeliveriesMap(req, res) {
    try {
        const activeOrders = db_1.memDb.orders.filter(o => ['DELIVERY_PARTNER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVING_SOON'].includes(o.status));
        const deliveries = activeOrders.map(o => {
            const dp = db_1.memDb.deliveryPartners[0];
            return {
                orderId: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                customerName: o.deliveryAddress?.recipientName,
                customerAddress: `${o.deliveryAddress?.flatHouseNo}, ${o.deliveryAddress?.area}, ${o.deliveryAddress?.pincode}`,
                destinationCoords: {
                    latitude: Number(o.deliveryAddress?.latitude || 11.3985),
                    longitude: Number(o.deliveryAddress?.longitude || 77.6088),
                },
                partnerName: dp?.user?.fullName || 'Poopesh',
                partnerPhone: dp?.user?.phoneNumber || '+91 93607 61595',
                partnerCoords: {
                    latitude: Number(dp?.currentLatitude || 11.3950),
                    longitude: Number(dp?.currentLongitude || 77.6055),
                },
                lastUpdated: dp?.lastLocationUpdate || new Date().toISOString(),
            };
        });
        res.json(deliveries);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// Product Management
async function createProduct(req, res) {
    try {
        const { name, categoryId, brandId, shortDescription, description, price, mrp, unit, meatType, isPackaged, ingredients, storageInstructions, stock, imageUrl, } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newProduct = {
            id: `prod-${(0, uuid_1.v4)().substring(0, 8)}`,
            name,
            slug: `${slug}-${Math.floor(Math.random() * 900 + 100)}`,
            categoryId,
            brandId: brandId || null,
            shortDescription: shortDescription || description.slice(0, 80),
            description,
            price: Number(price),
            mrp: Number(mrp || price),
            unit: unit || 'kg',
            netWeightGrams: unit === 'kg' ? 1000 : 500,
            meatType: meatType || 'CURRY_CUT',
            isPackaged: Boolean(isPackaged),
            ingredients: ingredients || null,
            storageInstructions: storageInstructions || 'Refrigerate at 0°C to 4°C',
            isAvailable: true,
            isFeatured: false,
            isBestSeller: false,
            averageRating: 5.0,
            totalReviews: 0,
            images: [
                {
                    id: `img-${Date.now()}`,
                    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80',
                    isPrimary: true,
                },
            ],
            inventory: {
                currentStock: Number(stock || 50),
                lowStockAlert: 5,
            },
        };
        db_1.memDb.products.unshift(newProduct);
        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const index = db_1.memDb.products.findIndex(p => p.id === id);
        if (index === -1)
            return res.status(404).json({ message: 'Product not found' });
        db_1.memDb.products[index] = {
            ...db_1.memDb.products[index],
            ...req.body,
            price: req.body.price !== undefined ? Number(req.body.price) : db_1.memDb.products[index].price,
            mrp: req.body.mrp !== undefined ? Number(req.body.mrp) : db_1.memDb.products[index].mrp,
        };
        if (req.body.stock !== undefined && db_1.memDb.products[index].inventory) {
            db_1.memDb.products[index].inventory.currentStock = Number(req.body.stock);
        }
        if (req.body.images !== undefined) {
            db_1.memDb.products[index].images = req.body.images;
        }
        res.json({ message: 'Product updated successfully', product: db_1.memDb.products[index] });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function addProductImage(req, res) {
    try {
        const { id } = req.params;
        const { imageUrl, altText, isPrimary } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ message: 'Image URL is required' });
        }
        const product = db_1.memDb.products.find(p => p.id === id);
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        if (!product.images)
            product.images = [];
        const newImage = {
            id: `img-${Date.now()}`,
            imageUrl,
            altText: altText || product.name,
            isPrimary: Boolean(isPrimary) || product.images.length === 0,
        };
        if (newImage.isPrimary) {
            product.images.forEach(img => (img.isPrimary = false));
        }
        product.images.push(newImage);
        res.status(201).json({ message: 'Image added successfully', image: newImage, product });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function deleteProductImage(req, res) {
    try {
        const { id, imageId } = req.params;
        const product = db_1.memDb.products.find(p => p.id === id);
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        if (!product.images)
            return res.status(404).json({ message: 'Image not found' });
        const wasPrimary = product.images.find(img => img.id === imageId)?.isPrimary;
        product.images = product.images.filter(img => img.id !== imageId);
        // If deleted image was primary and other images remain, set first as primary
        if (wasPrimary && product.images.length > 0) {
            product.images[0].isPrimary = true;
        }
        res.json({ message: 'Image removed successfully', product });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function setPrimaryProductImage(req, res) {
    try {
        const { id, imageId } = req.params;
        const product = db_1.memDb.products.find(p => p.id === id);
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        if (!product.images)
            return res.status(404).json({ message: 'Images not found' });
        product.images.forEach(img => {
            img.isPrimary = img.id === imageId;
        });
        res.json({ message: 'Primary product photo updated', product });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
async function toggleProductAvailability(req, res) {
    try {
        const { id } = req.params;
        const product = db_1.memDb.products.find(p => p.id === id);
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        product.isAvailable = !product.isAvailable;
        res.json({ message: `Product availability set to ${product.isAvailable}`, product });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}
// Business Settings & Zones
async function getStoreSettings(req, res) {
    res.json(db_1.memDb.storeSettings);
}
async function updateStoreSettings(req, res) {
    db_1.memDb.storeSettings = { ...db_1.memDb.storeSettings, ...req.body };
    res.json({ message: 'Store settings updated successfully', settings: db_1.memDb.storeSettings });
}
async function getDeliveryZones(req, res) {
    res.json(db_1.memDb.deliveryZones);
}
async function updateDeliveryZone(req, res) {
    const { id } = req.params;
    const index = db_1.memDb.deliveryZones.findIndex(z => z.id === id);
    if (index === -1)
        return res.status(404).json({ message: 'Zone not found' });
    db_1.memDb.deliveryZones[index] = { ...db_1.memDb.deliveryZones[index], ...req.body };
    res.json({ message: 'Delivery zone updated successfully', zone: db_1.memDb.deliveryZones[index] });
}
async function addDeliveryZone(req, res) {
    const newZone = {
        id: `zone-${Date.now()}`,
        ...req.body,
        baseFee: Number(req.body.baseFee || 20),
        perKmFeeAbove: Number(req.body.perKmFeeAbove || 5),
        minOrderValue: Number(req.body.minOrderValue || 150),
        maxDistanceKm: Number(req.body.maxDistanceKm || 15),
        freeDeliveryThreshold: Number(req.body.freeDeliveryThreshold || 500),
        isActive: true,
    };
    db_1.memDb.deliveryZones.push(newZone);
    res.status(201).json({ message: 'Delivery zone added', zone: newZone });
}
async function getDeliverySlots(req, res) {
    res.json(db_1.memDb.deliverySlots);
}
async function getDeliveryPartners(req, res) {
    const partners = db_1.memDb.deliveryPartners.map(dp => {
        const u = db_1.memDb.users.find(user => user.id === dp.userId);
        return {
            ...dp,
            user: u ? {
                fullName: u.fullName,
                phoneNumber: u.phoneNumber,
                email: u.email,
            } : {
                fullName: 'Poopesh',
                phoneNumber: '9360761595',
                email: 'poopesh.delivery@meatmart.in',
            },
        };
    });
    res.json(partners);
}
async function addDeliveryPartner(req, res) {
    try {
        const { fullName, phoneNumber, password, vehicleType = 'Hero Splendor Bike', vehicleNumber = 'TN 33 BM 7890' } = req.body;
        if (!fullName || !phoneNumber || !password) {
            return res.status(400).json({ message: 'Full name, mobile number, and password are required.' });
        }
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        const existing = db_1.memDb.users.find(u => u.phoneNumber === cleanPhone);
        if (existing) {
            return res.status(400).json({ message: 'An account with this mobile number already exists.' });
        }
        const userId = `user-delivery-${Date.now().toString().slice(-4)}`;
        const dpId = `dp-${Date.now().toString().slice(-4)}`;
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const newUser = {
            id: userId,
            phoneNumber: cleanPhone,
            email: `${fullName.toLowerCase().replace(/\s+/g, '')}.delivery@meatmart.in`,
            fullName,
            passwordHash,
            role: 'DELIVERY_PARTNER',
            isActive: true,
            avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        db_1.memDb.users.push(newUser);
        const newPartner = {
            id: dpId,
            userId,
            vehicleType,
            vehicleNumber,
            drivingLicenseNo: `TN33-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
            isVerified: true,
            isOnline: true,
            currentLatitude: 11.3950,
            currentLongitude: 77.6055,
            lastLocationUpdate: new Date().toISOString(),
            totalEarnings: 0,
            rating: 5.0,
        };
        db_1.memDb.deliveryPartners.push(newPartner);
        res.status(201).json({
            message: 'Delivery boy added successfully!',
            partner: {
                ...newPartner,
                user: {
                    fullName: newUser.fullName,
                    phoneNumber: newUser.phoneNumber,
                    email: newUser.email,
                },
            },
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message || 'Failed to add delivery boy.' });
    }
}
async function getReports(req, res) {
    const orders = db_1.memDb.orders;
    const totalSales = orders.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);
    // Group by category sales
    const categorySales = {};
    orders.forEach(o => {
        o.items?.forEach((item) => {
            const prod = db_1.memDb.products.find(p => p.id === item.productId);
            const cat = db_1.memDb.categories.find(c => c.id === prod?.categoryId);
            const catName = cat?.name || 'Fresh Chicken';
            categorySales[catName] = (categorySales[catName] || 0) + item.totalPrice;
        });
    });
    res.json({
        totalSales,
        totalOrders: orders.length,
        averageOrderValue: orders.length > 0 ? Math.round(totalSales / orders.length) : 0,
        categorySales,
        bestSellers: db_1.memDb.products.filter(p => p.isBestSeller),
        lowStockItems: db_1.memDb.products.filter(p => (p.inventory?.currentStock ?? 10) <= 10),
    });
}
