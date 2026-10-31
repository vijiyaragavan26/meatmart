import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Truck,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  Star,
  MapPin,
  Search,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product, ProductCategory } from '../types';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Service Area Checker state
  const [checkPincode, setCheckPincode] = useState('');
  const [checkResult, setCheckResult] = useState<{ serviceable: boolean; message: string } | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products'),
        ]);
        setCategories(catsRes);
        setProducts(prodsRes.products || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = checkPincode.trim();
    if (pin === '638116') {
      setCheckResult({
        serviceable: true,
        message: '⚡ Great news! Express 30-45 minute delivery is available in Kanjikovil! (Base fee ₹20, Free above ₹500)',
      });
    } else if (pin === '638052') {
      setCheckResult({
        serviceable: true,
        message: '✅ Perundurai Town & SIPCOT is covered! Delivery in 45-60 mins.',
      });
    } else if (pin === '638102') {
      setCheckResult({
        serviceable: true,
        message: '✅ Chithode & Erode Bypass is covered! Delivery in 45-60 mins.',
      });
    } else {
      setCheckResult({
        serviceable: false,
        message: `Currently PIN ${pin} is outside our active delivery radius from Kanjikovil. We are expanding soon!`,
      });
    }
  };

  const bestSellers = products.filter(p => p.isBestSeller);
  const featuredCombos = products.filter(p => p.categoryId === 'cat-10' || p.isFeatured);
  const sakthiMasalas = products.filter(p => p.brand?.name === 'Sakthi Masala');

  return (
    <div className="space-y-10 sm:space-y-16 pb-12 sm:pb-16 overflow-x-hidden">
      {/* 1. Large Hero Banner (Mobile-First) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-meat-900 via-meat-800 to-charcoal-900 text-white rounded-2xl sm:rounded-3xl mx-2 sm:mx-6 lg:mx-8 mt-2 sm:mt-4 shadow-xl">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-meat-700/80 border border-meat-500/50 text-meat-100 text-[11px] sm:text-xs font-bold uppercase tracking-wide mx-auto lg:mx-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Direct Farm-to-Door in Kanjikovil</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {t('home.heroTitle')}
            </h1>

            <p className="text-xs sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {t('home.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                to="/shop"
                className="w-full sm:w-auto min-h-[44px] bg-fresh-600 hover:bg-fresh-700 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full shadow-lg shadow-fresh-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <span>{t('home.shopNow')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#service-checker"
                className="w-full sm:w-auto min-h-[44px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-full border border-white/20 flex items-center justify-center gap-2 transition"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>{t('home.serviceAreaChecker')}</span>
              </a>
            </div>

            {/* Quality Badges */}
            <div className="pt-4 sm:pt-6 border-t border-meat-700/60 grid grid-cols-3 gap-2 sm:gap-4 text-xs">
              <div className="text-center lg:text-left">
                <span className="block font-bold text-white text-xs sm:text-sm">100% Fresh</span>
                <span className="text-gray-400 text-[10px] sm:text-[11px]">Never frozen</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-bold text-white text-xs sm:text-sm">45 Mins</span>
                <span className="text-gray-400 text-[10px] sm:text-[11px]">Express dispatch</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-bold text-white text-xs sm:text-sm">Sakthi Masala</span>
                <span className="text-gray-400 text-[10px] sm:text-[11px]">Original Erode</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Visual */}
          <div className="relative">
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-white/10 group">
              <img
                src="https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80"
                alt="Fresh Country Chicken"
                className="w-full h-56 sm:h-80 lg:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-transparent to-transparent flex flex-col justify-end p-4 sm:p-6">
                <span className="bg-meat-600 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full w-fit mb-1">
                  Signature Specialty
                </span>
                <h3 className="text-sm sm:text-lg font-bold text-white">Kanjikovil Country Chicken (Nattu Kozhi)</h3>
                <p className="text-[11px] sm:text-xs text-gray-300">Free-range, natural firm texture, rich aroma.</p>
              </div>
            </div>

            {/* Floating Sakthi Masala Badge (Desktop/Tablet) */}
            <div className="hidden sm:flex absolute -bottom-5 -left-5 z-20 bg-white text-charcoal-900 p-3.5 rounded-2xl shadow-xl border border-gray-100 items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80"
                alt="Sakthi Masala"
                className="w-11 h-11 rounded-xl object-cover"
              />
              <div>
                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Authentic Spices</div>
                <div className="text-xs font-black text-gray-900">Sakthi Chicken & Mutton Masalas</div>
                <div className="text-[10px] text-fresh-700 font-bold">Original Erode Packets</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category (Responsive Grid) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <span className="text-meat-700 font-bold text-[11px] sm:text-xs uppercase tracking-wider block">{t('home.categorySubtitle')}</span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900">{t('home.shopByCategory')}</h2>
          </div>
          <Link to="/shop" className="text-meat-700 hover:text-meat-900 font-bold text-xs flex items-center gap-1 min-h-[44px]">
            <span>{t('common.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 columns on mobile, 8 on wide displays */}
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-gray-100 shadow-xs hover:shadow-lg hover:border-meat-200 transition-all flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden mb-1.5 sm:mb-2 bg-gray-50 border-2 border-transparent group-hover:border-meat-600 transition">
                <img
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=200&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  loading="lazy"
                />
              </div>
              <h3 className="font-bold text-[10px] sm:text-xs text-gray-900 group-hover:text-meat-700 transition leading-tight line-clamp-2">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Best-Selling Fresh Products (2-Col Mobile, 4-Col Desktop, 5-Col Wide) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 sm:mb-8">
          <div>
            <div className="flex items-center gap-1 text-meat-600 font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-0.5">
              <Flame className="w-3.5 h-3.5 fill-current text-meat-600" />
              <span>Customer Favorites</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900">{t('home.bestSellers')}</h2>
          </div>
          <Link to="/shop" className="text-meat-700 hover:text-meat-900 font-bold text-xs flex items-center gap-1 min-h-[44px]">
            <span>{t('common.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. Frequently Purchased Sakthi Masalas Showcase */}
      <section className="bg-cream-100/60 border-y border-cream-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div>
              <span className="text-meat-700 font-bold text-[11px] sm:text-xs uppercase tracking-wider block">Authentic Erode Spices</span>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900">Frequently Purchased Sakthi Masala</h2>
              <p className="text-xs text-gray-600 mt-0.5 hidden sm:block">Add your cooking masala along with fresh chicken in one single delivery!</p>
            </div>
            <Link to="/shop?brand=sakthi-masala" className="text-meat-700 hover:text-meat-900 font-bold text-xs flex items-center gap-1 min-h-[44px]">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-6">
            {sakthiMasalas.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Weekend Combo Packs & Offers */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-8">
          <span className="text-fresh-700 font-bold text-[11px] sm:text-xs uppercase tracking-wider block">Save More with Bundles</span>
          <h2 className="text-xl sm:text-3xl font-black text-gray-900">Today's Deals & Combo Packs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {featuredCombos.slice(0, 2).map((combo) => (
            <div
              key={combo.id}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row gap-4 sm:gap-6 items-center"
            >
              <img
                src={combo.images[0]?.imageUrl}
                alt={combo.name}
                className="w-full sm:w-40 h-40 sm:h-40 rounded-xl object-cover"
                loading="lazy"
              />
              <div className="flex-1 space-y-1.5 w-full">
                <span className="bg-fresh-100 text-fresh-800 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Weekend Special Deal
                </span>
                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">{combo.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{combo.description}</p>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-lg sm:text-xl font-black text-meat-700">₹{combo.price}</span>
                  {combo.mrp > combo.price && (
                    <span className="text-xs text-gray-400 line-through">₹{combo.mrp}</span>
                  )}
                </div>
                <Link
                  to={`/product/${combo.slug || combo.id}`}
                  className="inline-flex items-center justify-center min-h-[44px] w-full sm:w-auto mt-2 bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition"
                >
                  View Combo Deal
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Freshness & Quality Promise */}
      <section className="bg-charcoal-900 text-white py-12 sm:py-16 rounded-2xl sm:rounded-3xl mx-2 sm:mx-6 lg:mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 space-y-2">
            <span className="text-fresh-400 font-bold text-[11px] sm:text-xs uppercase tracking-wider">The MeatMart Standard</span>
            <h2 className="text-2xl sm:text-3xl font-black">Our Freshness & Hygiene Promise</h2>
            <p className="text-xs sm:text-sm text-gray-300">
              Unlike local open meat stalls, MeatMart operates a sanitized, temperature-controlled facility in Kanjikovil with strict food-safety protocols.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-fresh-500/20 text-fresh-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white">100% Antibiotic & Chemical Free</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Our birds and country chickens are naturally raised on local Erode farms without synthetic growth promoters or harmful preservatives.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-meat-500/20 text-meat-400 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white">Cut Fresh After Your Order</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                We never store pre-cut meat on ice beds. Your meat is dressed, washed with purified RO water, and packed right after you hit confirm.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 space-y-2 sm:space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white">Chilled Insulated Delivery</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Delivered in food-grade, vacuum-sealed bags placed in temperature-controlled cooler carriers so the meat stays fresh at 0°C to 4°C until your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. How Ordering Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <span className="text-meat-700 font-bold text-xs uppercase tracking-wider">{t('home.howItWorksSubtitle')}</span>
          <h2 className="text-xl sm:text-3xl font-black text-gray-900 mt-1">{t('home.howItWorks')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          <div className="flex flex-col items-center text-center space-y-2 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-meat-50 text-meat-700 flex items-center justify-center text-lg font-black">
              1
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-gray-900">{t('home.step1Title')}</h3>
            <p className="text-xs text-gray-500">
              {t('home.step1Desc')}
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-fresh-50 text-fresh-700 flex items-center justify-center text-lg font-black">
              2
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-gray-900">{t('home.step2Title')}</h3>
            <p className="text-xs text-gray-500">
              {t('home.step2Desc')}
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg font-black">
              3
            </div>
            <h3 className="font-bold text-xs sm:text-sm text-gray-900">{t('home.step3Title')}</h3>
            <p className="text-xs text-gray-500">
              {t('home.step3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 8. Delivery Service-Area Checker */}
      <section id="service-checker" className="max-w-3xl mx-auto px-3 sm:px-6 scroll-mt-24">
        <div className="bg-gradient-to-br from-cream-100 via-white to-fresh-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-cream-200 shadow-sm">
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-meat-700 bg-meat-50 px-3 py-1 rounded-full">
              <MapPin className="w-3.5 h-3.5" />
              <span>Service Availability</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-gray-900">Check Delivery to Your Area</h3>
            <p className="text-xs text-gray-600">Enter your 6-digit postal code to check instant delivery availability.</p>
          </div>

          <form onSubmit={handleCheckPincode} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              value={checkPincode}
              onChange={(e) => setCheckPincode(e.target.value)}
              placeholder="e.g. 638116 or 638052"
              className="flex-1 px-4 py-3 min-h-[44px] text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-meat-600 font-bold"
            />
            <button
              type="submit"
              className="min-h-[44px] bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-xs transition"
            >
              Verify Area
            </button>
          </form>

          {checkResult && (
            <div
              className={`mt-4 p-3.5 rounded-xl text-xs font-semibold ${
                checkResult.serviceable
                  ? 'bg-fresh-100 text-fresh-900 border border-fresh-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {checkResult.message}
            </div>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-gray-500">
            <span>Coverage:</span>
            <span className="font-bold text-gray-700">638116 (Kanjikovil)</span>
            <span>•</span>
            <span className="font-bold text-gray-700">638052 (Perundurai)</span>
            <span>•</span>
            <span className="font-bold text-gray-700">638102 (Chithode)</span>
          </div>
        </div>
      </section>

      {/* 9. Customer Reviews & Ratings */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-10">
          <span className="text-meat-700 font-bold text-[11px] sm:text-xs uppercase tracking-wider">Testimonials</span>
          <h2 className="text-xl sm:text-3xl font-black text-gray-900">Loved by Kanjikovil Families</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2 sm:space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-gray-600 italic">
              "The Nattu Kozhi was cut so neatly without blood clots or feathers. It made an extraordinary Chettinad kuzhambu for Sunday lunch. Delivered in 35 minutes!"
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="font-bold text-xs text-gray-900 block">Karthik R.</span>
              <span className="text-[10px] sm:text-[11px] text-gray-400">Kaveri Nagar, Kanjikovil</span>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2 sm:space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-gray-600 italic">
              "Having Sakthi Chicken Masala and fresh boneless breast delivered together is super convenient. The live map tracking let me see the delivery boy right as he reached the gate."
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="font-bold text-xs text-gray-900 block">Priya M.</span>
              <span className="text-[10px] sm:text-[11px] text-gray-400">SIPCOT, Perundurai</span>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-2 sm:space-y-3">
            <div className="flex text-amber-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-gray-600 italic">
              "The chicken biryani cuts and Sakthi Biryani Masala made an extraordinary Sunday lunch. Meat was juicy and tender with zero smell. Best delivery in Erode district."
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="font-bold text-xs text-gray-900 block">Anand Kumar</span>
              <span className="text-[10px] sm:text-[11px] text-gray-400">Bypass Road, Chithode</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Frequently Asked Questions (FAQ) */}
      <section className="max-w-3xl mx-auto px-3 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-meat-700 font-bold text-xs uppercase tracking-wider">Got Questions?</span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2.5">
          {[
            {
              q: 'Where is MeatMart located and what areas do you serve?',
              a: 'Our central store and processing hub is situated on Main Road, Kanjikovil, Erode District. We currently deliver to Kanjikovil (638116), Perundurai (638052), and Chithode/Erode Bypass (638102) with dynamic distance pricing.',
            },
            {
              q: 'How does live order tracking work on mobile?',
              a: 'Once your order is picked up, our delivery partner shares real-time GPS coordinates via Socket.IO. You can watch their live location marker move on Google Maps, check the live route, remaining distance in kilometers, and estimated time of arrival right on your phone.',
            },
            {
              q: 'What is the Proof of Delivery OTP?',
              a: 'For security and peace of mind, every customer receives a 4-digit OTP on their tracking screen. You only share this OTP with the delivery partner upon inspecting your fresh package at your doorstep.',
            },
            {
              q: 'Are the Sakthi Masala products authentic?',
              a: 'Yes, 100%! We are directly located in Erode district, the homeland of Sakthi Masala. All packaged spices come straight from verified distribution channels with batch details and manufacturer seals intact.',
            },
            {
              q: 'Can I pay using Cash on Delivery (COD)?',
              a: 'Yes! We support Cash on Delivery, UPI, Debit Cards, Credit Cards, and Net Banking through our secure payment gateway.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 min-h-[44px] text-left flex items-center justify-between text-xs sm:text-sm font-bold text-gray-900 hover:text-meat-700"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180 text-meat-600' : ''}`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-2">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
