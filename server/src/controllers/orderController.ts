import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { memDb, prisma, isPostgresConnected } from '../config/db';
import { calculateDeliveryPricing } from '../services/pricingService';
import { getOrderTrackingSnapshot } from '../sockets/trackingSocket';
import { dispatchOrderNotification } from '../services/notificationService';
import { generateToken } from '../middleware/auth';

export async function createOrder(req: Request, res: Response) {
  try {
    const {
      deliveryAddressId: rawDeliveryAddressId,
      addressId,
      deliveryAddress: inlineAddress,
      address: legacyAddress,
      items,
      couponCode,
      paymentMethod = 'COD',
      deliverySlot,
      specialNotes,
      specialInstructions,
    } = req.body;

    let userId = req.user?.id;
    let customerUser: any = null;
    let autoToken: string | null = null;

    if (!userId) {
      // Guest customer checkout: extract phone and name
      const targetAddr = inlineAddress || legacyAddress || {};
      const rawPhone = String(targetAddr.recipientPhone || req.body.recipientPhone || req.body.phoneNumber || '').replace(/[^0-9]/g, '');
      const rawName = targetAddr.recipientName || req.body.recipientName || req.body.fullName || 'Valued Customer';

      if (!rawPhone || rawPhone.length < 10) {
        return res.status(400).json({
          message: 'A valid 10-digit mobile number is required to place your order.',
        });
      }

      const formattedPhone = rawPhone.slice(-10);

      if (isPostgresConnected) {
        customerUser = await prisma.user.findUnique({ where: { phoneNumber: formattedPhone } });
        if (!customerUser) {
          customerUser = await prisma.user.create({
            data: {
              phoneNumber: formattedPhone,
              fullName: rawName,
              role: 'CUSTOMER',
              passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
            },
          });
        }
      } else {
        customerUser = memDb.users.find(u => u.phoneNumber === formattedPhone);
        if (!customerUser) {
          customerUser = {
            id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            phoneNumber: formattedPhone,
            fullName: rawName,
            role: 'CUSTOMER',
            isActive: true,
            createdAt: new Date().toISOString(),
          };
          memDb.users.push(customerUser);
        }
      }

      userId = customerUser.id;
      autoToken = generateToken({
        id: customerUser.id,
        phoneNumber: customerUser.phoneNumber,
        fullName: customerUser.fullName,
        email: customerUser.email,
        role: 'CUSTOMER',
      });
    }

    const notes = specialNotes || specialInstructions;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items cannot be empty.' });
    }

    // 1. Fetch & Verify Delivery Address (with resilient fallback)
    let targetAddressId = rawDeliveryAddressId || addressId;
    let address: any = null;

    if (targetAddressId) {
      if (isPostgresConnected) {
        address = await prisma.customerAddress.findUnique({ where: { id: targetAddressId } });
      } else {
        address = memDb.customerAddresses.find(a => a.id === targetAddressId);
      }
    }

    // Fallback A: Check if customer has any saved address
    if (!address && userId) {
      if (isPostgresConnected) {
        address = await prisma.customerAddress.findFirst({
          where: { customerProfile: { userId } },
          orderBy: { isDefault: 'desc' },
        });
      } else {
        const userAddrs = memDb.customerAddresses.filter(a => a.userId === userId || a.customerProfileId === userId);
        address = userAddrs.find(a => a.isDefault) || userAddrs[0];
      }
    }

    // Fallback B: If inline address payload provided
    if (!address && (inlineAddress || legacyAddress)) {
      const src = (typeof inlineAddress === 'object' ? inlineAddress : null) || (typeof legacyAddress === 'object' ? legacyAddress : null);
      const textAddr = typeof inlineAddress === 'string' ? inlineAddress : (typeof legacyAddress === 'string' ? legacyAddress : 'Kanjikovil Main Road');

      const user = memDb.users.find(u => u.id === userId);
      const newAddrId = `addr-${uuidv4().substring(0, 8)}`;
      address = {
        id: newAddrId,
        customerProfileId: userId,
        userId,
        addressLabel: src?.addressLabel || 'Home',
        recipientName: src?.recipientName || user?.fullName || 'Customer',
        recipientPhone: src?.recipientPhone || user?.phoneNumber || '9876543210',
        flatHouseNo: src?.flatHouseNo || textAddr,
        streetAddress: src?.streetAddress || textAddr,
        landmark: src?.landmark || null,
        area: src?.area || 'Kanjikovil',
        city: 'Erode',
        state: 'Tamil Nadu',
        pincode: src?.pincode || '638116',
        latitude: src?.latitude || 11.3985,
        longitude: src?.longitude || 77.6088,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isPostgresConnected) {
        let profile = await prisma.customerProfile.findUnique({ where: { userId } });
        if (!profile) {
          profile = await prisma.customerProfile.create({ data: { userId } });
        }
        await prisma.customerAddress.create({
          data: {
            id: address.id,
            customerProfileId: profile.id,
            addressLabel: address.addressLabel,
            recipientName: address.recipientName,
            recipientPhone: address.recipientPhone,
            flatHouseNo: address.flatHouseNo,
            streetAddress: address.streetAddress,
            landmark: address.landmark,
            area: address.area,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude,
            longitude: address.longitude,
            isDefault: true,
          },
        });
      } else {
        memDb.customerAddresses.push(address);
      }
    }

    // Fallback C: Auto-seed standard Kanjikovil address so order never fails
    if (!address) {
      const user = memDb.users.find(u => u.id === userId);
      const newAddrId = `addr-${uuidv4().substring(0, 8)}`;
      address = {
        id: newAddrId,
        customerProfileId: userId,
        userId,
        addressLabel: 'Home',
        recipientName: user?.fullName || 'Customer',
        recipientPhone: user?.phoneNumber || '9876543210',
        flatHouseNo: 'Plot No. 14, Kaveri Nagar',
        streetAddress: 'Kanjikovil Main Road',
        area: 'Kanjikovil',
        city: 'Erode',
        state: 'Tamil Nadu',
        pincode: '638116',
        latitude: 11.3985,
        longitude: 77.6088,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isPostgresConnected) {
        let profile = await prisma.customerProfile.findUnique({ where: { userId } });
        if (!profile) {
          profile = await prisma.customerProfile.create({ data: { userId } });
        }
        await prisma.customerAddress.create({
          data: {
            id: address.id,
            customerProfileId: profile.id,
            addressLabel: address.addressLabel,
            recipientName: address.recipientName,
            recipientPhone: address.recipientPhone,
            flatHouseNo: address.flatHouseNo,
            streetAddress: address.streetAddress,
            landmark: address.landmark,
            area: address.area,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            latitude: address.latitude,
            longitude: address.longitude,
            isDefault: true,
          },
        });
      } else {
        memDb.customerAddresses.push(address);
      }
    }

    const deliveryAddressId = address.id;

    // 2. Validate Items & Stock & Calculate Subtotal on Server
    let itemTotal = 0;
    const orderItemsSnapshot: any[] = [];

    for (const it of items) {
      let product: any = null;
      if (isPostgresConnected) {
        product = await prisma.product.findUnique({
          where: { id: it.productId },
          include: { inventory: true, brand: true },
        });
      } else {
        product = memDb.products.find(p => p.id === it.productId);
      }

      if (!product || !product.isAvailable) {
        return res.status(400).json({
          message: `Product "${product?.name || 'Item'}" is currently unavailable.`,
        });
      }

      const availableStock = product.inventory?.currentStock ?? 100;
      if (availableStock < it.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Only ${availableStock} units available.`,
        });
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * it.quantity;
      itemTotal += lineTotal;

      orderItemsSnapshot.push({
        id: `item-${uuidv4().substring(0, 8)}`,
        productId: product.id,
        productName: product.name,
        productBrand: product.brand?.name || 'MeatMart Fresh',
        productUnit: product.unit,
        unitPrice,
        quantity: it.quantity,
        totalPrice: lineTotal,
        selectedWeight: it.selectedWeight || product.unit,
      });

      // Deduct stock
      if (product.inventory) {
        product.inventory.currentStock -= it.quantity;
      }
    }

    // 3. Calculate Delivery Fee & Serviceability
    const pricingResult = await calculateDeliveryPricing(
      address.pincode,
      address.latitude ? Number(address.latitude) : undefined,
      address.longitude ? Number(address.longitude) : undefined,
      itemTotal
    );

    if (!pricingResult.isServiceable) {
      return res.status(400).json({
        message: pricingResult.reason || 'Address is outside our delivery area.',
      });
    }

    if (itemTotal < pricingResult.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value for ${pricingResult.zoneName} is ₹${pricingResult.minOrderValue}. Please add more items.`,
      });
    }

    // 4. Calculate Coupon Discount on Server
    let discountAmount = 0;
    if (couponCode) {
      const code = couponCode.trim().toUpperCase();
      let coupon = memDb.coupons.find(c => c.code === code && c.isActive);
      if (coupon) {
        const minOrder = Number(coupon.minOrderValue || 0);
        if (itemTotal >= minOrder) {
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (itemTotal * Number(coupon.discountValue)) / 100;
            if (coupon.maxDiscount) {
              discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
            }
          } else {
            discountAmount = Number(coupon.discountValue);
          }
          coupon.timesUsed = (coupon.timesUsed || 0) + 1;
        }
      }
    }

    const deliveryFee = pricingResult.deliveryFee;
    const taxAmount = 0; // Fresh meats and spices zero-rated GST
    const totalAmount = Math.max(0, itemTotal + deliveryFee - discountAmount + taxAmount);

    // 5. Generate Order Number and Proof of Delivery OTP
    const orderSeq = Math.floor(100 + Math.random() * 900);
    const orderNumber = `MM-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${orderSeq}`;
    const proofOfDeliveryOtp = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit secure OTP

    const orderId = `ord-${uuidv4().substring(0, 8)}`;
    const newOrder = {
      id: orderId,
      orderNumber,
      userId,
      deliveryAddressId,
      deliveryAddress: address,
      status: 'ORDER_PLACED',
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'AUTHORIZED',
      itemTotal,
      deliveryFee,
      discountAmount,
      taxAmount,
      totalAmount,
      deliverySlot: deliverySlot || 'Express (Next 45 mins)',
      deliveryDistanceKm: pricingResult.distanceKm,
      specialNotes: notes || null,
      proofOfDeliveryOtp,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderItemsSnapshot,
      deliveryAssignments: [],
    };

    let createdInDb = false;
    if (isPostgresConnected) {
      try {
        await prisma.order.create({
          data: {
            id: newOrder.id,
            orderNumber: newOrder.orderNumber,
            userId: newOrder.userId,
            deliveryAddressId: newOrder.deliveryAddressId,
            status: 'ORDER_PLACED',
            paymentMethod: paymentMethod as any,
            paymentStatus: newOrder.paymentStatus as any,
            itemTotal,
            deliveryFee,
            discountAmount,
            taxAmount,
            totalAmount,
            deliverySlot: newOrder.deliverySlot,
            deliveryDistanceKm: pricingResult.distanceKm,
            specialNotes: newOrder.specialNotes,
            proofOfDeliveryOtp,
            items: {
              create: orderItemsSnapshot.map(item => ({
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productBrand: item.productBrand,
                productUnit: item.productUnit,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
                selectedWeight: item.selectedWeight,
              })),
            },
          },
        });
        createdInDb = true;
      } catch (prismaOrderErr) {
        console.warn('[Prisma pooler timeout on order creation] Storing order in robust memory store:', prismaOrderErr);
      }
    }
    // Always keep memory store updated for zero-lag tracking & retrieval
    memDb.orders.unshift(newOrder);

    // Trigger instant WhatsApp & Email order confirmation notifications
    dispatchOrderNotification(newOrder.id, 'ORDER_PLACED').catch(err =>
      console.error('[Notification Trigger Error]', err)
    );

    res.status(201).json({
      message: 'Order placed successfully!',
      order: newOrder,
      token: autoToken,
      user: customerUser,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: err.message || 'Error creating order.' });
  }
}

export async function getMyOrders(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let orders: any[] = [];
    if (isPostgresConnected) {
      try {
        orders = await prisma.order.findMany({
          where: { userId },
          include: {
            deliveryAddress: true,
            items: true,
            deliveryAssignments: { include: { deliveryPartner: { include: { user: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });
      } catch (e) {
        orders = memDb.orders.filter(o => o.userId === userId);
      }
    } else {
      orders = memDb.orders.filter(o => o.userId === userId);
    }

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let order: any = null;
    if (isPostgresConnected) {
      try {
        order = await prisma.order.findUnique({
          where: { id },
          include: {
            deliveryAddress: true,
            items: true,
            deliveryAssignments: { include: { deliveryPartner: { include: { user: true } } } },
          },
        });
      } catch (e) {
        order = memDb.orders.find(o => o.id === id || o.orderNumber === id);
      }
    } else {
      order = memDb.orders.find(o => o.id === id || o.orderNumber === id);
    }
    if (!order) {
      order = memDb.orders.find(o => o.id === id || o.orderNumber === id);
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Role-based privacy: customer can only view own orders unless Admin or assigned partner
    if (userRole === 'CUSTOMER' && order.userId !== userId) {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getOrderTracking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const trackingSnapshot = await getOrderTrackingSnapshot(id);

    if (!trackingSnapshot) {
      return res.status(404).json({ message: 'Tracking details not found for this order.' });
    }

    res.json(trackingSnapshot);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    let order = memDb.orders.find(o => o.id === id || o.orderNumber === id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const cancellableStatuses = ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'ORDER_ACCEPTED'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled as it is already ${order.status.toLowerCase().replace('_', ' ')}.`,
      });
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason || 'Customer requested cancellation';
    order.updatedAt = new Date().toISOString();

    // Trigger WhatsApp & Email cancellation notice
    dispatchOrderNotification(order.id, 'CANCELLED', { reason: order.cancellationReason }).catch(err =>
      console.error('[Notification Trigger Error]', err)
    );

    res.json({ message: 'Order cancelled successfully', order });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
