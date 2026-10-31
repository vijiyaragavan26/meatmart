import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';

// Auth Pages (First Page Experience)
import { SignInPage } from './pages/auth/SignInPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Customer Protected Pages
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { NotificationSettingsPage } from './pages/NotificationSettingsPage';

// Delivery Portal Pages
import { DeliveryLoginPage } from './pages/delivery/DeliveryLoginPage';
import { DeliveryDashboardPage } from './pages/delivery/DeliveryDashboardPage';

// Admin Portal Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminDeliveriesMapPage } from './pages/admin/AdminDeliveriesMapPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

const CustomerLayout: React.FC<{ onOpenAuth: () => void; children: React.ReactNode }> = ({
  onOpenAuth,
  children,
}) => (
  <div className="min-h-screen flex flex-col bg-gray-50 overflow-x-hidden">
    <AnnouncementBar />
    <Navbar onOpenAuthModal={onOpenAuth} />
    <main className="flex-1 pb-20 md:pb-0">{children}</main>
    <Footer />
    <CartDrawer />
    <BottomNav onOpenAuth={onOpenAuth} />
  </div>
);

// Route Protection: Requires authenticated user
const CustomerProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-meat-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const DeliveryProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDeliveryPartner, isAdmin, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || (!isDeliveryPartner && !isAdmin)) {
    return <Navigate to="/delivery/login" replace />;
  }
  return <>{children}</>;
};

const AdminProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <Routes>
        {/* =========================================================================
            1. Main Storefront Portal (/ is the Main Storefront HomePage)
           ========================================================================= */}
        <Route
          path="/"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <HomePage />
            </CustomerLayout>
          }
        />
        <Route
          path="/home"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <HomePage />
            </CustomerLayout>
          }
        />

        {/* Authentication Pages */}
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* =========================================================================
            2. Customer Shopping Portal (/shop, /products, etc.)
               - Open for smooth browsing by all customers & guests
               - Checkout and Orders are protected
           ========================================================================= */}

        {/* Catalog routes */}
        <Route
          path="/shop"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <CatalogPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/products"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <CatalogPage />
            </CustomerLayout>
          }
        />

        {/* Product Details */}
        <Route
          path="/product/:id"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <ProductDetailPage />
            </CustomerLayout>
          }
        />

        {/* Cart View */}
        <Route
          path="/cart"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <CheckoutPage />
            </CustomerLayout>
          }
        />

        {/* Checkout - Guest and Authenticated */}
        <Route
          path="/checkout"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <CheckoutPage onOpenAuth={() => setIsAuthModalOpen(true)} />
            </CustomerLayout>
          }
        />

        {/* Orders History */}
        <Route
          path="/orders"
          element={
            <CustomerProtected>
              <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
                <MyOrdersPage />
              </CustomerLayout>
            </CustomerProtected>
          }
        />
        <Route
          path="/my-orders"
          element={
            <CustomerProtected>
              <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
                <MyOrdersPage />
              </CustomerLayout>
            </CustomerProtected>
          }
        />

        {/* Customer Notification Settings */}
        <Route
          path="/settings/notifications"
          element={
            <CustomerProtected>
              <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
                <NotificationSettingsPage />
              </CustomerLayout>
            </CustomerProtected>
          }
        />

        {/* Live Order Tracking - Open for Customer View */}
        <Route
          path="/tracking/:id"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <OrderTrackingPage />
            </CustomerLayout>
          }
        />
        <Route
          path="/track-order/:orderId"
          element={
            <CustomerLayout onOpenAuth={() => setIsAuthModalOpen(true)}>
              <OrderTrackingPage />
            </CustomerLayout>
          }
        />

        {/* =========================================================================
            3. Delivery Partner Portal
           ========================================================================= */}
        <Route path="/delivery" element={<DeliveryLoginPage />} />
        <Route path="/delivery/login" element={<DeliveryLoginPage />} />
        <Route
          path="/delivery/dashboard"
          element={
            <DeliveryProtected>
              <DeliveryDashboardPage />
            </DeliveryProtected>
          }
        />

        {/* =========================================================================
            4. Administrator Portal
           ========================================================================= */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <AdminProtected>
              <AdminLayout />
            </AdminProtected>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="deliveries" element={<AdminDeliveriesMapPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
