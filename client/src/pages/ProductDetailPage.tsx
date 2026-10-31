import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  ShieldCheck,
  Truck,
  Heart,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ChevronRight,
  Share2,
  ZoomIn,
  X,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToast, setAddedToast] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.product);
        setRelated(res.related || []);
        if (res.product?.images?.[0]) {
          setSelectedImage(res.product.images[0].imageUrl);
        }
        setSelectedWeight(res.product?.unit || '500g');
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-meat-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-500 font-bold">Loading fresh cuts from Kanjikovil...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Product Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">The cut or masala you are looking for is unavailable.</p>
        <Link to="/shop" className="inline-block bg-meat-600 text-white text-xs font-bold px-6 py-3 min-h-[44px] rounded-xl">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedWeight);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedWeight);
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 sm:space-y-12 pb-24 md:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto no-scrollbar py-1">
        <Link to="/" className="hover:text-meat-700 whitespace-nowrap">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link to="/shop" className="hover:text-meat-700 whitespace-nowrap">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-gray-800 font-semibold truncate max-w-[200px] sm:max-w-md">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
        {/* Left: Image Gallery */}
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm h-64 sm:h-96 md:h-[420px] relative group">
            <img
              src={selectedImage || product.images?.[0]?.imageUrl}
              alt={product.images?.[0]?.altText || product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80';
              }}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
              onClick={() => setIsZoomOpen(true)}
              loading="lazy"
            />
            {product.mrp > product.price && (
              <span className="absolute top-3 left-3 bg-meat-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-full shadow-md">
                ₹{product.mrp - product.price} OFF
              </span>
            )}

            {/* Zoom Inspection Trigger Button */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition shadow-md flex items-center gap-1.5 text-xs font-bold"
              aria-label="Zoom Photo"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="hidden sm:inline">Zoom High-Res</span>
            </button>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition min-h-[44px] ${
                    selectedImage === img.imageUrl ? 'border-meat-600 ring-2 ring-meat-100' : 'border-gray-200'
                  }`}
                  aria-label={img.altText || product.name}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText || product.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=200&q=80';
                    }}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Purchase Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Brand & Category badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-meat-100 text-meat-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
              {product.brand?.name || 'MeatMart Fresh'}
            </span>
            {product.meatType && product.meatType !== 'NOT_APPLICABLE' && (
              <span className="bg-charcoal-900 text-white font-bold px-2.5 py-1 rounded-full text-[10px]">
                {product.meatType.replace('_', ' ')}
              </span>
            )}
            {product.isPackaged && (
              <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full text-[10px]">
                Packaged Spices
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {product.name}
          </h1>

          {/* Ratings */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-amber-700 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{Number(product.averageRating || 5.0).toFixed(1)}</span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 font-medium">{product.totalReviews || 24} Verified Ratings</span>
          </div>

          {/* Pricing Box */}
          <div className="p-3.5 sm:p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl font-black text-meat-800">
              ₹{product.price}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                ₹{product.mrp}
              </span>
            )}
            <span className="text-xs text-gray-500 font-medium">/ {selectedWeight || product.unit}</span>
            <span className="ml-auto text-[11px] font-bold text-fresh-700 bg-fresh-100 px-2.5 py-1 rounded-full">
              In Stock (Kanjikovil Hub)
            </span>
          </div>

          {/* Weight Selection Pills (Touch-friendly >= 44px) */}
          {!product.isPackaged && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                Select Cut Weight:
              </label>
              <div className="flex flex-wrap gap-2">
                {['500g', '1kg'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWeight(w)}
                    className={`px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition border flex items-center justify-center ${
                      selectedWeight === w
                        ? 'bg-meat-600 text-white border-meat-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {w} Fresh Cut
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop/Tablet Quantity Selector & Action Buttons */}
          <div className="hidden sm:flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-1 min-h-[44px]">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-700 hover:bg-gray-50 min-h-[36px] min-w-[36px]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold text-sm text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-700 hover:bg-gray-50 min-h-[36px] min-w-[36px]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 min-w-[140px] min-h-[44px] bg-meat-50 hover:bg-meat-100 text-meat-700 border-2 border-meat-600 font-extrabold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 min-w-[140px] min-h-[44px] bg-meat-600 hover:bg-meat-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-xl shadow-lg shadow-meat-600/20 transition"
            >
              Buy Now
            </button>
          </div>

          {/* Toast Notification */}
          {addedToast && (
            <div className="bg-fresh-50 border border-fresh-200 text-fresh-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-fresh-600" />
              <span>Added to your cart successfully!</span>
            </div>
          )}

          {/* Delivery & Assurance Info */}
          <div className="border-t border-gray-100 pt-5 space-y-3 text-xs text-gray-600">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-meat-600 flex-shrink-0" />
              <span>Express 30–45 min delivery in Kanjikovil, Perundurai, & Chithode.</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-fresh-600 flex-shrink-0" />
              <span>100% Halal cut, RO washed, non-frozen fresh farm chicken.</span>
            </div>
            <div className="flex items-center gap-3">
              <PackageCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Vacuum-sealed food-grade hygienic leak-proof packaging.</span>
            </div>
          </div>

          {/* Product Description */}
          <div className="border-t border-gray-100 pt-5 space-y-2">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">About this Product</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Storage & Cooking Tips */}
          {product.storageInstructions && (
            <div className="bg-cream-100/60 p-4 rounded-2xl border border-amber-200 text-xs space-y-1">
              <span className="font-bold text-amber-900 block">Storage & Freshness Advice</span>
              <p className="text-amber-800">{product.storageInstructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Purchase Action Bar (< sm) */}
      <div className="fixed bottom-14 left-0 right-0 sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 p-2.5 px-3 z-30 shadow-lg flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-gray-400 font-semibold block uppercase">Total</span>
          <span className="text-lg font-black text-meat-700">₹{product.price * quantity}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stepper on mobile */}
          <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-0.5">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-700 min-h-[32px] min-w-[32px]"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center font-bold text-xs text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-700 min-h-[32px] min-w-[32px]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="px-3 py-2.5 min-h-[44px] bg-meat-50 text-meat-700 border border-meat-600 rounded-xl text-xs font-extrabold flex items-center justify-center"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            className="px-4 py-2.5 min-h-[44px] bg-meat-600 text-white rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">Pairs Well With This Cut</h2>
              <p className="text-xs text-gray-500 mt-0.5">Authentic Sakthi Masalas and fresh cuts popular in Kanjikovil</p>
            </div>
            <Link to="/shop" className="text-xs font-bold text-meat-700 hover:underline">
              View All
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {related.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Fullscreen High-Resolution Photo Inspection Modal */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close Preview"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
            <div className="bg-white/5 rounded-3xl p-2 border border-white/10 overflow-hidden shadow-2xl flex items-center justify-center max-h-[75vh]">
              <img
                src={selectedImage || product.images?.[0]?.imageUrl}
                alt={product.name}
                className="max-h-[70vh] w-auto object-contain rounded-2xl"
              />
            </div>
            <div className="mt-4 text-center text-white">
              <h3 className="font-extrabold text-base">{product.name}</h3>
              <p className="text-xs text-gray-300 mt-1">
                Authentic MeatMart Kanjikovil Product Photography • 100% Original Farm Cuts & Sealed Masalas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
