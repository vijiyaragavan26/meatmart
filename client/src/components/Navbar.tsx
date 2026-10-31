import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  MapPin,
  Search,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Package,
  Shield,
  Bike,
  Menu,
  X,
  Phone,
  Sparkles,
  Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuthModal }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isCustomer, isDeliveryPartner, isAdmin } = useAuth();
  const { itemCount, openCart } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Live product search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.get(`/products/search?q=${encodeURIComponent(searchQuery)}`);
          setSuggestions(res);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
    }
  }, [mobileSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Logo & Mobile Location Indicator */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link to="/home" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
              <img
                src="/logo.svg"
                alt="MeatMart Logo"
                className="h-9 w-9 sm:h-11 sm:w-11 transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-meat-700 leading-none">
                  Meat<span className="text-fresh-600">Mart</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-charcoal-800/60 mt-0.5 hidden xs:block">
                  Kanjikovil • Fresh Meats
                </span>
              </div>
            </Link>

            {/* Mobile compact location tag */}
            <div className="flex md:hidden items-center gap-1 bg-cream-100 text-charcoal-800 px-2 py-0.5 rounded-full text-[10px] font-bold truncate">
              <MapPin className="w-3 h-3 text-meat-600 flex-shrink-0" />
              <span className="truncate">Kanjikovil 638116</span>
            </div>
          </div>

          {/* Desktop Location Selector */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-100 border border-cream-200 text-xs flex-shrink-0">
            <MapPin className="w-4 h-4 text-meat-600 flex-shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] text-gray-400 font-medium">{t('nav.deliverTo')}</span>
              <span className="font-bold text-gray-800">Kanjikovil (638116)</span>
            </div>
          </div>

          {/* Desktop Search Bar with Autocomplete Suggestions */}
          <div ref={searchRef} className="relative flex-1 max-w-lg hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-meat-600/20 focus:border-meat-600 transition"
              />
            </form>

            {/* Desktop Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-2 divide-y divide-gray-50">
                  {suggestions.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowSuggestions(false);
                        navigate(`/product/${item.slug || item.id}`);
                      }}
                      className="p-2.5 flex items-center gap-3 hover:bg-meat-50/50 rounded-xl cursor-pointer transition"
                    >
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-gray-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-meat-700 font-semibold">₹{item.price} / {item.unit}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Menu: Language Selector, Portals & User Auth & Cart */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Desktop Language Selector */}
            <div className="hidden sm:block">
              <LanguageSelector variant="header" />
            </div>

            {/* Mobile Search Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-full text-gray-700 hover:bg-gray-100 active:scale-95 transition"
              aria-label="Toggle Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Desktop Quick Portal Switcher Pills */}
            <div className="hidden xl:flex items-center gap-1.5 bg-gray-100 p-1 rounded-full text-[11px] font-semibold">
              <Link
                to="/delivery"
                className="px-2.5 py-1 rounded-full text-gray-600 hover:text-blue-700 hover:bg-white flex items-center gap-1 transition shadow-xs"
              >
                <Bike className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('nav.deliveryPartner')}</span>
              </Link>
              <Link
                to="/admin"
                className="px-2.5 py-1 rounded-full text-gray-600 hover:text-meat-700 hover:bg-white flex items-center gap-1 transition shadow-xs"
              >
                <Shield className="w-3.5 h-3.5 text-meat-600" />
                <span>{t('nav.admin')}</span>
              </Link>
            </div>

            {/* User Account / Login Button */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1.5 pl-2 sm:pl-3 pr-2 rounded-full border border-gray-200 hover:border-meat-200 hover:bg-meat-50/40 transition text-xs font-bold text-gray-800 min-h-[44px]"
                  aria-label="Account Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-meat-100 text-meat-800 flex items-center justify-center font-bold text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <span className="hidden sm:inline-block max-w-[90px] truncate">{user.fullName.split(' ')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-bold text-xs text-gray-900">{user.fullName}</p>
                      <p className="text-[11px] text-gray-400 font-mono">+91 {user.phoneNumber}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-meat-50 text-meat-700">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/my-orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 min-h-[44px]"
                    >
                      <Package className="w-4 h-4 text-meat-600" />
                      <span>{t('nav.myOrders')}</span>
                    </Link>

                    <Link
                      to="/settings/notifications"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 min-h-[44px]"
                    >
                      <Bell className="w-4 h-4 text-meat-600" />
                      <span>Notification Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-meat-700 font-bold hover:bg-meat-50 min-h-[44px]"
                      >
                        <Shield className="w-4 h-4 text-meat-600" />
                        <span>{t('nav.admin')}</span>
                      </Link>
                    )}

                    {isDeliveryPartner && (
                      <Link
                        to="/delivery"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-blue-700 font-bold hover:bg-blue-50 min-h-[44px]"
                      >
                        <Bike className="w-4 h-4 text-blue-600" />
                        <span>{t('nav.deliveryPartner')}</span>
                      </Link>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left font-semibold min-h-[44px]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-meat-600 text-meat-700 font-bold text-xs hover:bg-meat-50 transition min-h-[44px]"
              >
                <UserIcon className="w-4 h-4" />
                <span>{t('nav.login')}</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative flex items-center justify-center w-11 h-11 rounded-full bg-meat-600 text-white shadow-md shadow-meat-600/20 hover:bg-meat-700 active:scale-95 transition"
              title={t('nav.cart')}
              aria-label={`View Cart with ${itemCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-fresh-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-11 h-11 text-gray-700 rounded-full hover:bg-gray-100 active:scale-95 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Expandable Mobile Search Bar */}
        {mobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 border-t border-gray-100">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={mobileSearchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-meat-600 min-h-[44px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>

            {/* Mobile Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowSuggestions(false);
                      setMobileSearchOpen(false);
                      navigate(`/product/${item.slug || item.id}`);
                    }}
                    className="p-3 flex items-center gap-3 hover:bg-meat-50/50 cursor-pointer min-h-[44px]"
                  >
                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-meat-700 font-semibold">₹{item.price} / {item.unit}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Slide-Down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4 shadow-xl">
          {/* Mobile Language Selector */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
            <LanguageSelector variant="mobile" />
          </div>

          <div className="p-3 bg-cream-50 rounded-2xl border border-cream-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-meat-600" />
              <div>
                <span className="font-bold text-gray-900 block">Kanjikovil Store Hub</span>
                <span className="text-[11px] text-gray-500">Delivering in 30–45 mins</span>
              </div>
            </div>
            <a href="tel:+917604906429" className="text-fresh-700 font-bold flex items-center gap-1 min-h-[36px] px-2">
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 min-h-[44px] rounded-xl bg-gray-50 text-gray-800 text-center flex items-center justify-center hover:bg-gray-100 transition"
            >
              {t('nav.shop')}
            </Link>
            <Link
              to="/my-orders"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 min-h-[44px] rounded-xl bg-gray-50 text-gray-800 text-center flex items-center justify-center hover:bg-gray-100 transition"
            >
              {t('nav.myOrders')}
            </Link>
            <Link
              to="/settings/notifications"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 min-h-[44px] rounded-xl bg-gray-50 text-gray-800 text-center flex items-center justify-center gap-1.5 hover:bg-gray-100 transition"
            >
              <Bell className="w-4 h-4 text-meat-600" />
              <span>Notifications</span>
            </Link>
            <Link
              to="/delivery"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 min-h-[44px] rounded-xl bg-blue-50 text-blue-700 text-center flex items-center justify-center gap-1.5 hover:bg-blue-100 transition"
            >
              <Bike className="w-4 h-4" />
              <span>{t('nav.deliveryPartner')}</span>
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 min-h-[44px] rounded-xl bg-meat-50 text-meat-700 text-center flex items-center justify-center gap-1.5 hover:bg-meat-100 transition"
            >
              <Shield className="w-4 h-4" />
              <span>{t('nav.admin')}</span>
            </Link>
          </div>

          {!user && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuthModal?.();
              }}
              className="w-full min-h-[44px] py-3 bg-meat-600 text-white font-bold text-xs rounded-xl shadow-sm text-center"
            >
              {t('nav.login')}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
