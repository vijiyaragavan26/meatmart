export type Role = 'CUSTOMER' | 'DELIVERY_PARTNER' | 'ADMIN';

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_ACCEPTED'
  | 'PREPARING'
  | 'PACKED'
  | 'DELIVERY_PARTNER_ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'ARRIVING_SOON'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_INITIATED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'COD'
  | 'UPI'
  | 'GPAY'
  | 'PHONEPE'
  | 'PAYTM'
  | 'CARD'
  | 'NETBANKING'
  | 'RAZORPAY'
  | 'CASHFREE';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type MeatType =
  | 'RAW'
  | 'CLEANED'
  | 'CURRY_CUT'
  | 'BIRYANI_CUT'
  | 'BONELESS'
  | 'WHOLE'
  | 'NOT_APPLICABLE';

export interface User {
  id: string;
  phoneNumber: string;
  email?: string | null;
  fullName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
}

export interface CustomerAddress {
  id: string;
  addressLabel: string;
  recipientName: string;
  recipientPhone: string;
  flatHouseNo: string;
  streetAddress: string;
  landmark?: string | null;
  area: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  category?: ProductCategory;
  brandId?: string | null;
  brand?: Brand | null;
  shortDescription?: string | null;
  description: string;
  price: number;
  mrp: number;
  unit: string;
  netWeightGrams?: number | null;
  meatType: MeatType;
  isPackaged: boolean;
  ingredients?: string | null;
  allergens?: string | null;
  storageInstructions?: string | null;
  manufacturerName?: string | null;
  batchNumber?: string | null;
  expiryDate?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  averageRating: number;
  totalReviews: number;
  images: ProductImage[];
  inventory?: {
    currentStock: number;
    lowStockAlert: number;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedWeight?: string | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productBrand?: string | null;
  productUnit: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  selectedWeight?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  deliveryAddressId: string;
  deliveryAddress: CustomerAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  itemTotal: number;
  deliveryFee: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  deliverySlot?: string | null;
  deliveryDistanceKm?: number | null;
  specialNotes?: string | null;
  proofOfDeliveryOtp?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  deliveryAssignments?: {
    id: string;
    deliveryPartnerId: string;
    status: string;
    deliveryPartner: {
      id: string;
      user: {
        fullName: string;
        phoneNumber: string;
        avatarUrl?: string | null;
      };
      vehicleType: string;
      vehicleNumber: string;
      currentLatitude?: number | null;
      currentLongitude?: number | null;
      rating: number;
    };
  }[];
}

export interface TrackingData {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: CustomerAddress;
  storeLocation: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
  };
  deliveryPartner?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    vehicleType: string;
    vehicleNumber: string;
    avatarUrl?: string | null;
    rating: number;
    currentLocation?: {
      latitude: number;
      longitude: number;
      recordedAt: string;
      heading?: number;
      speed?: number;
      isDemo?: boolean;
    };
  } | null;
  estimatedArrivalMinutes?: number | null;
  remainingDistanceKm?: number | null;
  statusTimeline: {
    status: OrderStatus;
    label: string;
    completed: boolean;
    timestamp?: string;
  }[];
  proofOfDeliveryOtp?: string | null;
  items?: any[];
  totalAmount?: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pincode: string;
  baseDistanceKm: number;
  baseFee: number;
  perKmFeeAbove: number;
  minOrderValue: number;
  maxDistanceKm: number;
  freeDeliveryThreshold: number;
  isActive: boolean;
}

export interface DeliverySlot {
  id: string;
  slotName: string;
  startTime: string;
  endTime: string;
  maxOrders: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeLatitude: number;
  storeLongitude: number;
  openingTime: string;
  closingTime: string;
  isStoreOpen: boolean;
  allowCod: boolean;
  taxRatePercent: number;
  minOrderValue: number;
  freeDeliveryAbove: number;
  maxDeliveryRadiusKm: number;
}
