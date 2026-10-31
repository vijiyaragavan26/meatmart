import { PrismaClient } from '@prisma/client';
import {
  initialCategories,
  initialBrands,
  initialProducts,
  initialZones,
  initialSlots,
  initialCoupons,
  initialStoreSettings,
  createInitialUsers,
} from '../src/config/initialData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MeatMart PostgreSQL Database Seeding...');

  // 1. Store Settings
  await prisma.storeSettings.upsert({
    where: { id: initialStoreSettings.id },
    update: {},
    create: {
      id: initialStoreSettings.id,
      storeName: initialStoreSettings.storeName,
      storeAddress: initialStoreSettings.storeAddress,
      storePhone: initialStoreSettings.storePhone,
      storeEmail: initialStoreSettings.storeEmail,
      storeLatitude: initialStoreSettings.storeLatitude,
      storeLongitude: initialStoreSettings.storeLongitude,
      openingTime: initialStoreSettings.openingTime,
      closingTime: initialStoreSettings.closingTime,
      isStoreOpen: initialStoreSettings.isStoreOpen,
      allowCod: initialStoreSettings.allowCod,
      taxRatePercent: initialStoreSettings.taxRatePercent,
      minOrderValue: initialStoreSettings.minOrderValue,
      freeDeliveryAbove: initialStoreSettings.freeDeliveryAbove,
      maxDeliveryRadiusKm: initialStoreSettings.maxDeliveryRadiusKm,
    },
  });

  // 2. Categories
  for (const cat of initialCategories) {
    await prisma.productCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      },
    });
  }

  // 3. Brands
  for (const brand of initialBrands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logoUrl: brand.logoUrl,
        description: brand.description,
      },
    });
  }

  // 4. Products & Inventory
  for (const prod of initialProducts) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        shortDescription: prod.shortDescription,
        description: prod.description,
        price: prod.price,
        mrp: prod.mrp,
        unit: prod.unit,
        netWeightGrams: prod.netWeightGrams,
        meatType: prod.meatType as any,
        isPackaged: prod.isPackaged,
        ingredients: prod.ingredients,
        allergens: prod.allergens,
        storageInstructions: prod.storageInstructions,
        manufacturerName: prod.manufacturerName,
        isAvailable: prod.isAvailable,
        isFeatured: prod.isFeatured,
        isBestSeller: prod.isBestSeller,
        averageRating: prod.averageRating,
        totalReviews: prod.totalReviews,
        images: {
          create: prod.images.map(img => ({
            id: img.id,
            imageUrl: img.imageUrl,
            altText: img.altText,
            isPrimary: img.isPrimary,
          })),
        },
        inventory: {
          create: {
            currentStock: prod.inventory.currentStock,
            lowStockAlert: prod.inventory.lowStockAlert,
          },
        },
      },
    });
  }

  // 5. Delivery Zones
  for (const zone of initialZones) {
    await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      update: {},
      create: {
        id: zone.id,
        name: zone.name,
        pincode: zone.pincode,
        baseDistanceKm: zone.baseDistanceKm,
        baseFee: zone.baseFee,
        perKmFeeAbove: zone.perKmFeeAbove,
        minOrderValue: zone.minOrderValue,
        maxDistanceKm: zone.maxDistanceKm,
        freeDeliveryThreshold: zone.freeDeliveryThreshold,
        isActive: zone.isActive,
      },
    });
  }

  // 6. Delivery Slots
  for (const slot of initialSlots) {
    await prisma.deliverySlot.upsert({
      where: { id: slot.id },
      update: {},
      create: {
        id: slot.id,
        slotName: slot.slotName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxOrders: slot.maxOrders,
        isActive: slot.isActive,
      },
    });
  }

  // 7. Coupons
  for (const cp of initialCoupons) {
    await prisma.coupon.upsert({
      where: { code: cp.code },
      update: {},
      create: {
        id: cp.id,
        code: cp.code,
        description: cp.description,
        discountType: cp.discountType,
        discountValue: cp.discountValue,
        minOrderValue: cp.minOrderValue,
        maxDiscount: cp.maxDiscount,
        usageLimit: cp.usageLimit,
        perUserLimit: cp.perUserLimit,
        timesUsed: cp.timesUsed,
        validFrom: new Date(cp.validFrom),
        validUntil: new Date(cp.validUntil),
        isActive: cp.isActive,
      },
    });
  }

  // 8. Users & Profiles
  const { users, addresses, deliveryPartners } = await createInitialUsers();

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { phoneNumber: u.phoneNumber },
      update: {},
      create: {
        id: u.id,
        phoneNumber: u.phoneNumber,
        email: u.email,
        fullName: u.fullName,
        passwordHash: u.passwordHash,
        role: u.role as any,
        avatarUrl: u.avatarUrl,
      },
    });

    if (u.role === 'CUSTOMER') {
      const profile = await prisma.customerProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
        },
      });

      for (const addr of addresses.filter(a => a.userId === user.id)) {
        await prisma.customerAddress.upsert({
          where: { id: addr.id },
          update: {},
          create: {
            id: addr.id,
            customerProfileId: profile.id,
            addressLabel: addr.addressLabel,
            recipientName: addr.recipientName,
            recipientPhone: addr.recipientPhone,
            flatHouseNo: addr.flatHouseNo,
            streetAddress: addr.streetAddress,
            landmark: addr.landmark,
            area: addr.area,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            latitude: addr.latitude,
            longitude: addr.longitude,
            isDefault: addr.isDefault,
          },
        });
      }
    } else if (u.role === 'DELIVERY_PARTNER') {
      const dp = deliveryPartners.find(d => d.userId === user.id);
      if (dp) {
        await prisma.deliveryPartner.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            id: dp.id,
            userId: user.id,
            vehicleType: dp.vehicleType,
            vehicleNumber: dp.vehicleNumber,
            drivingLicenseNo: dp.drivingLicenseNo,
            isVerified: dp.isVerified,
            isOnline: dp.isOnline,
            currentLatitude: dp.currentLatitude,
            currentLongitude: dp.currentLongitude,
            rating: dp.rating,
          },
        });
      }
    }
  }

  console.log('✅ MeatMart database successfully seeded!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
