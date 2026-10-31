import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    appliedCoupon,
    discount,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isCartOpen) return null;

  const freeDeliveryThreshold = 500;
  const amountNeededForFree = Math.max(0, freeDeliveryThreshold - subtotal);
  const deliveryFee = amountNeededForFree === 0 ? 0 : 20;
  const finalTotal = Math.max(0, subtotal - discount + deliveryFee);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput) return;
    const res = applyCoupon(couponInput);
    setCouponMsg({ text: res.message, error: !res.success });
    if (res.success) setCouponInput('');
  };

  const handleProceedToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-meat-50/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-meat-700" />
              <h2 className="font-extrabold text-gray-900 text-base">{t('cart.yourCart')}</h2>
              <span className="bg-meat-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {cart.length}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="bg-fresh-50 p-3 border-b border-fresh-100 text-xs text-fresh-900">
            {amountNeededForFree > 0 ? (
              <div>
                <span className="font-semibold">Add ₹{amountNeededForFree} more</span> for FREE Delivery in Kanjikovil!
                <div className="w-full bg-fresh-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-fresh-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-bold text-fresh-800">
                <span>🎉 {t('cart.freeDelivery')} unlocked!</span>
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                <ShoppingBag className="w-16 h-16 stroke-1 text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-800 text-base mb-1">{t('cart.emptyCartTitle')}</h3>
                <p className="text-xs text-gray-500 max-w-xs mb-4">
                  {t('cart.emptyCartDesc')}
                </p>
                <button
                  onClick={closeCart}
                  className="bg-meat-600 text-white font-bold text-xs px-6 py-3 min-h-[44px] rounded-xl hover:bg-meat-700 shadow transition"
                >
                  {t('cart.browseCatalog')}
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 transition"
                >
                  <img
                    src={item.product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=200&q=80'}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[11px] text-gray-500 font-medium block">
                      {item.selectedWeight || item.product.unit}
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm text-meat-800">
                        ₹{item.product.price * item.quantity}
                      </span>
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5 min-h-[36px]">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-meat-700 min-h-[28px] min-w-[28px]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold text-gray-800 px-1.5">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-meat-700 min-h-[28px] min-w-[28px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-gray-300 hover:text-red-500 self-start p-2 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title={t('common.remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-3">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon (e.g. MEATFIRST)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-meat-600 uppercase min-h-[44px]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gray-800 text-white text-xs font-bold px-4 py-2 min-h-[44px] rounded-xl hover:bg-black transition"
                >
                  {t('checkout.apply')}
                </button>
              </form>

              {couponMsg && (
                <div className={`text-xs ${couponMsg.error ? 'text-red-600' : 'text-fresh-700 font-medium'}`}>
                  {couponMsg.text}
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between bg-fresh-50 border border-fresh-200 px-3 py-2 rounded-xl text-xs text-fresh-800 font-semibold">
                  <span>Coupon {appliedCoupon} applied (-₹{discount})</span>
                  <button onClick={removeCoupon} className="text-red-600 hover:underline text-[11px] font-bold">
                    {t('checkout.remove')}
                  </button>
                </div>
              )}

              {/* Bill Details */}
              <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-fresh-700">
                    <span>{t('cart.discount')}</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('cart.deliveryFee')}</span>
                  <span className="font-semibold text-gray-900">
                    {deliveryFee === 0 ? <span className="text-fresh-700 font-bold">{t('cart.freeDelivery')}</span> : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-200">
                  <span>{t('cart.totalPayable')}</span>
                  <span className="text-meat-700 text-base">₹{finalTotal}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleProceedToCheckout}
                className="w-full min-h-[44px] bg-meat-600 hover:bg-meat-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-lg shadow-meat-600/20 flex items-center justify-center gap-2 transition"
              >
                <span>{t('cart.checkout')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 text-fresh-600" />
                <span>100% Fresh Meat Guarantee • Kanjikovil Express</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
