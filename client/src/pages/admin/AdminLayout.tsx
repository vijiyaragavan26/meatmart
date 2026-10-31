import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MapPin,
  Settings,
  BarChart3,
  LogOut,
  Store,
  ChevronRight,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Orders & Prep', path: '/admin/orders', icon: Package },
    { name: 'Live Deliveries Map', path: '/admin/deliveries', icon: MapPin },
    { name: 'Products & Stock', path: '/admin/products', icon: ShoppingBag },
    { name: 'Zones & Pricing', path: '/admin/settings', icon: Settings },
    { name: 'Reports & Sales', path: '/admin/reports', icon: BarChart3 },
  ];

  const currentNavName = navItems.find((i) => i.path === location.pathname)?.name || 'Admin Control Hub';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* Mobile / Tablet Top Header (< lg) */}
      <header className="lg:hidden bg-charcoal-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="MeatMart" className="h-7 w-7" />
            <span className="font-black text-sm tracking-tight text-white">MeatMart Admin</span>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs text-fresh-400 hover:text-fresh-300 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 min-h-[36px]"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Store</span>
        </Link>
      </header>

      {/* Desktop Persistent Sidebar (>= lg) */}
      <aside className="hidden lg:flex w-64 bg-charcoal-900 text-white flex-col flex-shrink-0 min-h-screen">
        {/* Brand */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <img src="/logo.svg" alt="MeatMart" className="h-9 w-9" />
          <div>
            <span className="text-lg font-black tracking-tight text-white block">MeatMart</span>
            <span className="text-[10px] text-meat-400 font-bold uppercase tracking-wider block">Admin Control Hub</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 custom-scrollbar overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition min-h-[44px] ${
                  isActive
                    ? 'bg-meat-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Store Link */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white py-2.5 px-3 rounded-xl hover:bg-white/5 transition min-h-[44px]"
          >
            <Store className="w-4 h-4 text-fresh-400 flex-shrink-0" />
            <span>View Public Store</span>
          </Link>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 py-2.5 px-3 rounded-xl hover:bg-white/5 transition font-semibold min-h-[44px]"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-over Drawer (< lg) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-charcoal-900 text-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src="/logo.svg" alt="MeatMart" className="h-8 w-8" />
                <div>
                  <span className="font-black text-sm block">MeatMart</span>
                  <span className="text-[10px] text-meat-400 font-bold uppercase tracking-wider block">Admin Panel</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition min-h-[44px] ${
                      isActive
                        ? 'bg-meat-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-gray-800 space-y-1">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white py-3 px-3 rounded-xl hover:bg-white/5 transition min-h-[44px]"
              >
                <Store className="w-4 h-4 text-fresh-400 flex-shrink-0" />
                <span>View Public Store</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center gap-2 text-xs text-red-400 hover:text-red-300 py-3 px-3 rounded-xl hover:bg-white/5 transition font-semibold min-h-[44px]"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Breadcrumb Bar (Desktop) */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-8 py-4 items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>MeatMart Kanjikovil</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-bold text-gray-900">{currentNavName}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-fresh-700 bg-fresh-50 px-3 py-1 rounded-full font-bold border border-fresh-200">
              <span className="w-2 h-2 rounded-full bg-fresh-500 animate-pulse" />
              <span>Kanjikovil Store Hub: Online</span>
            </span>
            <div className="font-bold text-gray-800">
              {user?.fullName} ({user?.role})
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
