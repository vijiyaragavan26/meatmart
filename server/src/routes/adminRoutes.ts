import { Router } from 'express';
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  assignDeliveryPartner,
  getActiveDeliveriesMap,
  createProduct,
  updateProduct,
  toggleProductAvailability,
  addProductImage,
  deleteProductImage,
  setPrimaryProductImage,
  getStoreSettings,
  updateStoreSettings,
  getDeliveryZones,
  updateDeliveryZone,
  addDeliveryZone,
  getDeliverySlots,
  getDeliveryPartners,
  addDeliveryPartner,
  getReports,
} from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';
import { getProducts } from '../controllers/productController';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN']));

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/reports', getReports);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/assign-delivery', assignDeliveryPartner);

// Delivery Tracking & Zones
router.get('/deliveries/active', getActiveDeliveriesMap);
router.get('/delivery-zones', getDeliveryZones);
router.post('/delivery-zones', addDeliveryZone);
router.patch('/delivery-zones/:id', updateDeliveryZone);
router.get('/delivery-slots', getDeliverySlots);
router.get('/delivery-partners', getDeliveryPartners);
router.post('/delivery-partners', addDeliveryPartner);

// Products
router.get('/products', getProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.patch('/products/:id/toggle-status', toggleProductAvailability);
router.post('/products/:id/images', addProductImage);
router.delete('/products/:id/images/:imageId', deleteProductImage);
router.patch('/products/:id/images/:imageId/primary', setPrimaryProductImage);

// Store Settings
router.get('/settings', getStoreSettings);
router.patch('/settings', updateStoreSettings);

export default router;
