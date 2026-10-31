"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memDb = exports.MemoryDatabase = exports.isPostgresConnected = exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
const client_1 = require("@prisma/client");
const initialData_1 = require("./initialData");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
exports.isPostgresConnected = false;
// In-Memory Database Store for robust local zero-setup operation
class MemoryDatabase {
    users = [];
    customerAddresses = [];
    deliveryPartners = [];
    categories = [...initialData_1.initialCategories];
    brands = [...initialData_1.initialBrands];
    products = [...initialData_1.initialProducts];
    orders = [];
    orderItems = [];
    payments = [];
    deliveryAssignments = [];
    deliveryLocations = [];
    deliveryZones = [...initialData_1.initialZones];
    deliverySlots = [...initialData_1.initialSlots];
    coupons = [...initialData_1.initialCoupons];
    storeSettings = { ...initialData_1.initialStoreSettings };
    notifications = [];
    otpRecords = [];
    notificationPreferences = [];
    notificationEvents = [];
    webhookLogs = [];
    reviews = [];
    supportTickets = [];
    auditLogs = [];
    async initialize() {
        const { users, addresses, deliveryPartners } = await (0, initialData_1.createInitialUsers)();
        this.users = users;
        this.customerAddresses = addresses;
        this.deliveryPartners = deliveryPartners;
        // Seed default notification preferences for existing users
        for (const u of this.users) {
            this.notificationPreferences.push({
                id: `pref-${u.id}`,
                userId: u.id,
                whatsappOrderUpdates: true,
                whatsappPromos: false,
                emailReceipts: true,
                emailPromos: false,
                smsAlerts: true,
                isEmailVerified: u.email ? true : false,
                isPhoneVerified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }
        // Create an initial sample order so tracking and admin have live data immediately
        const sampleOrderId = "ord-sample-101";
        const sampleOrder = {
            id: sampleOrderId,
            orderNumber: "MM-202610-101",
            userId: "user-customer-1",
            deliveryAddressId: "addr-1",
            deliveryAddress: this.customerAddresses[0],
            status: "OUT_FOR_DELIVERY",
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            itemTotal: 480,
            deliveryFee: 20,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 500,
            deliverySlot: "Early Morning Express (06:30 - 08:30)",
            deliveryDistanceKm: 2.8,
            specialNotes: "Please deliver fresh, cut without skin.",
            proofOfDeliveryOtp: "4829",
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            items: [
                {
                    id: "item-101-1",
                    orderId: sampleOrderId,
                    productId: "prod-1",
                    productName: "Kanjikovil Country Chicken (Nattu Kozhi) - Curry Cut",
                    productBrand: "MeatMart Fresh Farms",
                    productUnit: "kg",
                    unitPrice: 480,
                    quantity: 1,
                    totalPrice: 480,
                    selectedWeight: "1kg",
                },
            ],
            deliveryAssignments: [
                {
                    id: "da-101",
                    orderId: sampleOrderId,
                    deliveryPartnerId: "dp-1",
                    status: "IN_TRANSIT",
                    deliveryPartner: {
                        id: "dp-1",
                        user: {
                            fullName: "Poopesh",
                            phoneNumber: "9360761595",
                            avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80",
                        },
                        vehicleType: "Hero Splendor Bike",
                        vehicleNumber: "TN 33 BM 7890",
                        currentLatitude: 11.3965,
                        currentLongitude: 77.6068,
                        rating: 4.9,
                    },
                },
            ],
        };
        this.orders.push(sampleOrder);
        this.deliveryAssignments.push(sampleOrder.deliveryAssignments[0]);
        console.log('[Database] In-memory database initialized with fresh store data & sample orders.');
    }
}
exports.MemoryDatabase = MemoryDatabase;
exports.memDb = new MemoryDatabase();
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        // Warm-up query to verify connection is alive
        await exports.prisma.user.findFirst({ select: { id: true } });
        exports.isPostgresConnected = true;
        console.log('✅ Connected to PostgreSQL database via Prisma.');
    }
    catch (error) {
        exports.isPostgresConnected = false;
        console.warn('⚠️  PostgreSQL pooler unreachable/timed out. Pre-loading resilient In-Memory Database store with authentic seed data.');
    }
    // Always initialize memDb as instant fallback so zero downtime occurs if cloud DB pooler flaps
    await exports.memDb.initialize();
}
