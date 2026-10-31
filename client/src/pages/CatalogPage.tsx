import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Sparkles, RefreshCcw, X, Check } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product, ProductCategory, Brand } from '../types';
import { api } from '../services/api';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const selectedCategory = searchParams.get('category') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const searchQuery = searchParams.get('search') || '';
  const [sortBy, setSortBy] = useState('popular');

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedBrand ? 1 : 0) + (searchQuery ? 1 : 0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catsRes, brandsRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products/brands'),
        ]);
        setCategories(catsRes);
        setBrands(brandsRes);

        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedBrand) params.set('brand', selectedBrand);
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy) params.set('sort', sortBy);

        const prodsRes = await api.get(`/products?${params.toString()}`);
        setProducts(prodsRes.products || []);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory, selectedBrand, searchQuery, sortBy]);

  const handleCategoryClick = (slug: string) => {
    if (selectedCategory === slug) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', slug);
    }
    setSearchParams(searchParams);
  };

  const handleBrandClick = (slug: string) => {
    if (selectedBrand === slug) {
      searchParams.delete('brand');
    } else {
      searchParams.set('brand', slug);
    }
    setSearchParams(searchParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Header & Sort / Filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            {selectedCategory
              ? categories.find(c => c.slug === selectedCategory)?.name || 'Fresh Catalog'
              : selectedBrand
              ? `${brands.find(b => b.slug === selectedBrand)?.name || 'Brand'} Collection`
              : searchQuery
              ? `Search Results for "${searchQuery}"`
              : 'Fresh Meats & Sakthi Masalas'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing {products.length} fresh products sourced directly in Kanjikovil
          </p>
        </div>

        {/* Action Bar on Mobile/Desktop */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-xs active:bg-gray-100"
          >
            <Filter className="w-4 h-4 text-meat-600" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-meat-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1 min-h-[44px]">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-bold text-gray-800 bg-transparent py-1 pr-1 focus:outline-none cursor-pointer"
            >
              <option value="popular">Popularity</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Category Chips for Rapid 1-Tap Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        <button
          onClick={() => {
            searchParams.delete('category');
            setSearchParams(searchParams);
          }}
          className={`flex-shrink-0 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            !selectedCategory
              ? 'bg-meat-600 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>All Items</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`flex-shrink-0 px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-meat-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Bar on Desktop & Mobile */}
      {activeFilterCount > 0 && (
        <div className="bg-meat-50 px-3.5 py-2 rounded-xl border border-meat-200 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-meat-800">Active:</span>
            {selectedCategory && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-meat-200 text-meat-700 font-medium">
                {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              </span>
            )}
            {selectedBrand && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-meat-200 text-meat-700 font-medium">
                {brands.find(b => b.slug === selectedBrand)?.name || selectedBrand}
              </span>
            )}
            {searchQuery && (
              <span className="bg-white px-2 py-0.5 rounded-md border border-meat-200 text-meat-700 font-medium">
                "{searchQuery}"
              </span>
            )}
          </div>
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-meat-700 hover:text-meat-900 flex items-center gap-1 ml-2 flex-shrink-0 min-h-[36px]"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Main Grid & Desktop Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar (hidden on mobile, visible on lg) */}
        <aside className="hidden lg:block lg:col-span-1 space-y-5 sticky top-24">
          {/* Categories Filter */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">Categories</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    selectedCategory === cat.slug
                      ? 'bg-meat-600 text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brands Filter */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">Brand</h3>
            <div className="space-y-1">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandClick(brand.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                    selectedBrand === brand.slug
                      ? 'bg-meat-600 text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{brand.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area - 2 Columns on Mobile, 3 on Tablet/Laptop, 4 on Wide Screen */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-64 sm:h-80 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-100 flex flex-col items-center">
              <Sparkles className="w-12 h-12 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-900 mb-1">No products match your criteria</h3>
              <p className="text-xs text-gray-500 mb-4">Try clearing some filters or searching for fresh chicken cuts.</p>
              <button
                onClick={clearAllFilters}
                className="bg-meat-600 text-white text-xs font-bold px-6 py-3 min-h-[44px] rounded-xl hover:bg-meat-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-meat-600" />
                  <h2 className="text-sm font-black text-gray-900">Filter Products</h2>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Categories */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Categories</h3>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition flex items-center justify-between ${
                          selectedCategory === cat.slug
                            ? 'bg-meat-600 text-white font-bold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {selectedCategory === cat.slug && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Brands</h3>
                  <div className="space-y-1">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => handleBrandClick(brand.slug)}
                        className={`w-full text-left px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-medium transition flex items-center justify-between ${
                          selectedBrand === brand.slug
                            ? 'bg-meat-600 text-white font-bold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{brand.name}</span>
                        {selectedBrand === brand.slug && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 py-3 min-h-[44px] rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 min-h-[44px] rounded-xl bg-meat-600 text-white text-xs font-bold shadow-md hover:bg-meat-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
