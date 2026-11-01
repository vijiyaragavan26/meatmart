import {
  initialCategories,
  initialBrands,
  initialProducts,
  initialZones,
  initialSlots,
  initialCoupons,
  initialStoreSettings,
  createInitialUsers,
} from './initialData';

let prismaInstance: any = null;
if (process.env.DATABASE_URL) {
  try {
    // Dynamically load Prisma only when DATABASE_URL is configured
    const { PrismaClient } = require('@prisma/client');
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  } catch (e) {
    console.warn('PrismaClient init skipped, using resilient In-Memory Database store:', e);
  }
}

export const prisma = prismaInstance;

export let isPostgresConnected = false;

// In-Memory Database Store for robust local zero-setup operation
export class MemoryDatabase {
  users: any[] = [];
  customerAddresses: any[] = [];
  deliveryPartners: any[] = [];
  categories: any[] = [...initialCategories];
  brands: any[] = [...initialBrands];
  products: any[] = [...initialProducts];
  orders: any[] = [];
  orderItems: any[] = [];
  payments: any[] = [];
  deliveryAssignments: any[] = [];
  deliveryLocations: any[] = [];
  deliveryZones: any[] = [...initialZones];
  deliverySlots: any[] = [...initialSlots];
  coupons: any[] = [...initialCoupons];
  storeSettings: any = { ...initialStoreSettings };
  notifications: any[] = [];
  otpRecords: any[] = [];
  notificationPreferences: any[] = [];
  notificationEvents: any[] = [];
  webhookLogs: any[] = [];
  reviews: any[] = [];
  supportTickets: any[] = [];
  auditLogs: any[] = [];

  async initialize() {
    const { users, addresses, deliveryPartners } = await createInitialUsers();
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

export const memDb = new MemoryDatabase();

export async function connectDatabase() {
  try {
    await prisma.$connect();
    // Warm-up query to verify connection is alive
    await prisma.user.findFirst({ select: { id: true } });
    isPostgresConnected = true;
    console.log('✅ Connected to PostgreSQL database via Prisma.');
  } catch (error: any) {
    isPostgresConnected = false;
    console.warn('⚠️  PostgreSQL pooler unreachable/timed out. Pre-loading resilient In-Memory Database store with authentic seed data.');
  }
  // Always initialize memDb as instant fallback so zero downtime occurs if cloud DB pooler flaps
  await memDb.initialize();
}
