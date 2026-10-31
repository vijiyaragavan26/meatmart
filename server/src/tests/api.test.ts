import request from 'supertest';
import { app } from '../app';
import { memDb, connectDatabase } from '../config/db';
import { calculateHaversineDistance, calculateDeliveryPricing } from '../services/pricingService';

beforeAll(async () => {
  await connectDatabase();
});

describe('MeatMart API & Business Logic Test Suite', () => {
  let customerToken: string;
  let adminToken: string;
  let deliveryToken: string;
  let testOrderId: string;

  describe('1. Pricing & Delivery Zone Engine (Kanjikovil, Erode)', () => {
    it('calculates road distance accurately with Kanjikovil coordinates', () => {
      // Distance between Kanjikovil store and nearby Kaveri Nagar (~1.2 km)
      const dist = calculateHaversineDistance(11.3934, 77.6044, 11.3985, 77.6088);
      expect(dist).toBeGreaterThan(0.5);
      expect(dist).toBeLessThan(3.0);
    });

    it('calculates tier-1 delivery fee (0-3km: ₹20) for Kanjikovil PIN 638116', async () => {
      const res = await calculateDeliveryPricing('638116', 11.3985, 77.6088, 200);
      expect(res.isServiceable).toBe(true);
      expect(res.deliveryFee).toBe(20);
      expect(res.zoneName).toContain('Kanjikovil');
    });

    it('applies free delivery when cart reaches threshold', async () => {
      const res = await calculateDeliveryPricing('638116', 11.3985, 77.6088, 600);
      expect(res.isServiceable).toBe(true);
      expect(res.deliveryFee).toBe(0);
    });

    it('rejects checkout outside configured delivery areas', async () => {
      const res = await calculateDeliveryPricing('600001', 13.0827, 80.2707, 400); // Chennai PIN
      expect(res.isServiceable).toBe(false);
      expect(res.reason).toContain('outside MeatMart');
    });
  });

  describe('2. Authentication & Role-Based Access Control', () => {
    it('logs in seeded customer and returns valid JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber: '9876543210', password: 'Password@123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('CUSTOMER');
      customerToken = res.body.token;
    });

    it('logs in seeded administrator and returns admin token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber: '9876543212', password: 'Admin@123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('ADMIN');
      adminToken = res.body.token;
    });

    it('logs in seeded delivery partner and returns delivery token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phoneNumber: '9876543211', password: 'Delivery@123' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('DELIVERY_PARTNER');
      deliveryToken = res.body.token;
    });

    it('denies customer access to protected admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('allows admin access to admin dashboard', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalOrders).toBeDefined();
    });
  });

  describe('3. Product Catalog & Stock Validation', () => {
    it('fetches product listing with active categories and Sakthi Masalas', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(5);

      const hasCountryChicken = res.body.products.some((p: any) =>
        p.name.includes('Country Chicken')
      );
      expect(hasCountryChicken).toBe(true);

      const hasSakthi = res.body.products.some((p: any) =>
        p.name.includes('Sakthi')
      );
      expect(hasSakthi).toBe(true);
    });

    it('fetches categories and brands', async () => {
      const catRes = await request(app).get('/api/products/categories');
      expect(catRes.status).toBe(200);
      expect(catRes.body.length).toBe(8);

      const brandRes = await request(app).get('/api/products/brands');
      expect(brandRes.status).toBe(200);
      expect(brandRes.body.some((b: any) => b.name === 'Sakthi Masala')).toBe(true);
    });
  });

  describe('4. Order Placement, Stock Deduction & Snapshotting', () => {
    it('places a new order with stock validation and delivery calculation', async () => {
      const orderPayload = {
        deliveryAddressId: 'addr-1',
        items: [
          {
            productId: 'prod-2', // Broiler Chicken
            quantity: 2,
            selectedWeight: '1kg',
          },
          {
            productId: 'prod-7', // Sakthi Chicken Masala 200g
            quantity: 1,
            selectedWeight: '200g',
          },
        ],
        couponCode: 'MEATFIRST',
        paymentMethod: 'COD',
        deliverySlot: 'Early Morning Express (06:30 - 08:30)',
        specialNotes: 'Ring bell upon arrival',
      };

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderPayload);

      expect(res.status).toBe(201);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.orderNumber).toMatch(/^MM-2026/);
      expect(res.body.order.proofOfDeliveryOtp).toBeDefined();
      expect(res.body.order.items.length).toBe(2);

      // Verify item price snapshot
      expect(res.body.order.items[0].unitPrice).toBe(240);
      expect(res.body.order.discountAmount).toBe(50); // MEATFIRST applied

      testOrderId = res.body.order.id;
    });

    it('fetches live order tracking snapshot with route and delivery OTP', async () => {
      const res = await request(app).get(`/api/orders/${testOrderId}/tracking`);
      expect(res.status).toBe(200);
      expect(res.body.orderNumber).toBeDefined();
      expect(res.body.storeLocation.name).toContain('MeatMart');
      expect(res.body.statusTimeline.length).toBeGreaterThan(5);
    });
  });

  describe('5. Payment Processing & Duplicate Prevention', () => {
    it('creates a gateway payment order with correct amount in paise', async () => {
      const res = await request(app)
        .post('/api/payments/create-order')
        .send({ amount: 500, orderId: testOrderId });

      expect(res.status).toBe(200);
      expect(res.body.gatewayOrderId).toMatch(/^order_/);
      expect(res.body.amount).toBe(50000);
    });

    it('verifies payment and updates order status to PAYMENT_CONFIRMED', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .send({
          orderId: testOrderId,
          gatewayOrderId: 'order_test_123',
          gatewayPaymentId: 'pay_test_456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const orderCheck = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(orderCheck.body.paymentStatus).toBe('SUCCESS');
    });
  });

  describe('6. Delivery Partner Workflow & Live Navigation', () => {
    it('retrieves delivery partner assignments', async () => {
      const res = await request(app)
        .get('/api/delivery/assignments')
        .set('Authorization', `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.partnerProfile).toBeDefined();
    });

    it('marks order as picked up by delivery partner', async () => {
      const res = await request(app)
        .post(`/api/delivery/assignments/${testOrderId}/pickup`)
        .set('Authorization', `Bearer ${deliveryToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('PICKED_UP');
    });

    it('completes delivery with proof of delivery OTP verification', async () => {
      // Find the order OTP
      const orderRes = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      const otp = orderRes.body.proofOfDeliveryOtp;

      const completeRes = await request(app)
        .post(`/api/delivery/assignments/${testOrderId}/complete`)
        .set('Authorization', `Bearer ${deliveryToken}`)
        .send({ otp });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.order.status).toBe('DELIVERED');
    });
  });
});
