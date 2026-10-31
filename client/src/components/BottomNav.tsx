import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Grid, ShoppingBag, Package, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenAuth }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { itemCount, openCart } = useCart();
  const { user } = useAuth();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-bottom-nav"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1">
        {/* 1. Home */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              isActive
                ? 'text-meat-600 font-extrabold'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav.home')}</span>
        </NavLink>

        {/* 2. Shop / Categories */}
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              isActive
                ? 'text-meat-600 font-extrabold'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`
          }
        >
          <Grid className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav.categories')}</span>
        </NavLink>

        {/* 3. Cart with Badge */}
        <button
          type="button"
          onClick={openCart}
          className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] rounded-xl relative text-gray-500 hover:text-meat-600 transition-all active:scale-95"
          aria-label={`Shopping cart with ${itemCount} items`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-meat-600 text-white font-black text-[9px] min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-none">{t('nav.cart')}</span>
        </button>

        {/* 4. Orders */}
        <NavLink
          to="/my-orders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              isActive
                ? 'text-meat-600 font-extrabold'
                : 'text-gray-500 hover:text-gray-900 font-medium'
            }`
          }
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">{t('nav.myOrders')}</span>
        </NavLink>

        {/* 5. Profile / Login */}
        <button
          type="button"
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              navigate('/my-orders');
            }
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] rounded-xl transition-all ${
            user ? 'text-gray-700' : 'text-gray-500 hover:text-meat-600'
          }`}
          aria-label={user ? 'User Profile' : 'Sign in'}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight leading-none">
            {user ? user.fullName.split(' ')[0] : t('nav.profile')}
          </span>
        </button>
      </div>
    </nav>
  );
};
