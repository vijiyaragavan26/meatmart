import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (product: Product, quantity?: number, selectedWeight?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  appliedCoupon: string | null;
  discount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('meatmart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    return localStorage.getItem('meatmart_coupon');
  });

  useEffect(() => {
    localStorage.setItem('meatmart_cart', JSON.stringify(cart));
  }, [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(prev => !prev);

  const addToCart = (product: Product, quantity: number = 1, selectedWeight?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity, selectedWeight: selectedWeight || item.selectedWeight }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          product,
          quantity,
          selectedWeight: selectedWeight || product.unit,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem('meatmart_coupon');
  };

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const subtotal = cart.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);

  // Calculate discount based on active coupon
  let discount = 0;
  if (appliedCoupon === 'MEATFIRST' && subtotal >= 299) {
    discount = 50;
  } else if (appliedCoupon === 'FRESH50' && subtotal >= 499) {
    discount = Math.min(100, Math.round(subtotal * 0.15));
  } else if (appliedCoupon === 'SAKTHI10' && subtotal >= 200) {
    discount = Math.round(subtotal * 0.10);
  }

  const applyCoupon = (code: string) => {
    const formatted = code.trim().toUpperCase();
    if (formatted === 'MEATFIRST') {
      if (subtotal < 299) return { success: false, message: 'Minimum order ₹299 required for MEATFIRST.' };
      setAppliedCoupon('MEATFIRST');
      localStorage.setItem('meatmart_coupon', 'MEATFIRST');
      return { success: true, message: '₹50 discount applied!' };
    }
    if (formatted === 'FRESH50') {
      if (subtotal < 499) return { success: false, message: 'Minimum order ₹499 required for FRESH50.' };
      setAppliedCoupon('FRESH50');
      localStorage.setItem('meatmart_coupon', 'FRESH50');
      return { success: true, message: '15% discount applied!' };
    }
    if (formatted === 'FREESHIP') {
      if (subtotal < 399) return { success: false, message: 'Minimum order ₹399 required for free shipping.' };
      setAppliedCoupon('FREESHIP');
      localStorage.setItem('meatmart_coupon', 'FREESHIP');
      return { success: true, message: 'Free delivery applied on order!' };
    }

    return { success: false, message: 'Invalid or expired coupon code.' };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('meatmart_coupon');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        itemCount,
        subtotal,
        appliedCoupon,
        discount,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
