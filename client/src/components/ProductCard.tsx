import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Heart, Star, Plus, Minus, Flame } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState(product.unit);

  const cartItem = cart.find(item => item.productId === product.id);
  const discountPercent = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, selectedWeight);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItem) {
      addToCart(product, 1, selectedWeight);
    }
    navigate('/checkout');
  };

  const primaryImage = product.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-xl hover:border-meat-100 transition-all duration-300 flex flex-col overflow-hidden relative w-full">
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <div className="absolute top-2.5 left-2.5 z-10 bg-fresh-600 text-white text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs flex items-center gap-0.5 sm:gap-1">
          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
          <span>{discountPercent}% {t('productCard.off')}</span>
        </div>
      )}

      {/* Wishlist Button (min 44x44 touch target) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsWishlisted(!isWishlisted);
        }}
        className="absolute top-1.5 right-1.5 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xs flex items-center justify-center text-gray-400 hover:text-meat-600 transition active:scale-95"
        title="Save to Wishlist"
        aria-label="Save to Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-meat-600 text-meat-600' : ''}`} />
      </button>

      {/* Image Gallery Link */}
      <Link
        to={`/product/${product.slug || product.id}`}
        className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden bg-gray-50 block focus:outline-none focus:ring-2 focus:ring-meat-500"
      >
        <img
          src={primaryImage}
          alt={product.images?.[0]?.altText || product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Meat Cut Type Pill */}
        {product.meatType && product.meatType !== 'NOT_APPLICABLE' && (
          <div className="absolute bottom-1.5 left-1.5 bg-charcoal-900/85 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
            {product.meatType.replace('_', ' ')}
          </div>
        )}
        {product.isPackaged && (
          <div className="absolute bottom-1.5 left-1.5 bg-amber-600/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
            Packaged Spice
          </div>
        )}
      </Link>

      {/* Details Section */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-meat-700 tracking-wide uppercase text-[9px] sm:text-[10px] truncate max-w-[65%]">
            {product.brand?.name || 'MeatMart Fresh'}
          </span>
          <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px] sm:text-xs">
            <Star className="w-3 h-3 fill-current" />
            <span>{Number(product.averageRating || 5.0).toFixed(1)}</span>
          </div>
        </div>

        {/* Product Title */}
        <Link to={`/product/${product.slug || product.id}`} className="focus:outline-none">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-meat-700 transition min-h-[2.4rem] sm:min-h-[2.6rem]">
            {product.name}
          </h3>
        </Link>

        {/* Weight Selector */}
        {!product.isPackaged && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="text-gray-400 text-[10px] hidden xs:inline">{t('catalog.cutWeight')}:</span>
            <div className="flex gap-1">
              {['500g', '1kg'].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setSelectedWeight(w)}
                  className={`px-2 py-1 min-h-[28px] rounded-md border text-[10px] sm:text-[11px] font-bold transition ${
                    selectedWeight === w
                      ? 'border-meat-600 bg-meat-50 text-meat-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-3">
          {/* Price & Unit */}
          <div className="flex items-baseline flex-wrap gap-1 sm:gap-2 mb-2.5">
            <span className="text-base sm:text-lg font-black text-meat-800">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                ₹{product.mrp}
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">/ {product.unit}</span>
          </div>

          {/* Cart Buttons with comfortable minimum 44px touch targets */}
          {cartItem ? (
            <div className="flex items-center justify-between bg-meat-50 border border-meat-200 rounded-xl p-1 min-h-[44px]">
              <button
                type="button"
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white shadow-xs flex items-center justify-center text-meat-700 hover:bg-meat-100 active:scale-95 transition"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-black text-xs sm:text-sm text-meat-900 px-1">{cartItem.quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-meat-600 text-white shadow-xs flex items-center justify-center hover:bg-meat-700 active:scale-95 transition"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="min-h-[44px] flex items-center justify-center gap-1 py-2 px-1.5 sm:px-2 rounded-xl border-2 border-meat-600 text-meat-700 font-bold text-[11px] sm:text-xs hover:bg-meat-50 active:scale-95 transition"
              >
                <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t('productCard.add')}</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="min-h-[44px] flex items-center justify-center py-2 px-1.5 sm:px-2 rounded-xl bg-meat-600 text-white font-extrabold text-[11px] sm:text-xs hover:bg-meat-700 shadow-xs active:scale-95 transition"
              >
                {t('productDetail.buyNow')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
