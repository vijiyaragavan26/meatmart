import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Check,
  X,
  Edit,
  Trash2,
  Sparkles,
  AlertTriangle,
  Image as ImageIcon,
  Star,
  Upload,
  Eye,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, ProductCategory, Brand } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [brandId, setBrandId] = useState('brand-2');
  const [price, setPrice] = useState(250);
  const [mrp, setMrp] = useState(280);
  const [unit, setUnit] = useState('kg');
  const [meatType, setMeatType] = useState('CURRY_CUT');
  const [isPackaged, setIsPackaged] = useState(false);
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState(50);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAltText, setImageAltText] = useState('');

  // Image Manager Modal state
  const [imageModalProduct, setImageModalProduct] = useState<Product | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, brandsRes] = await Promise.all([
        api.get('/products'),
        api.get('/products/categories'),
        api.get('/products/brands'),
      ]);
      setProducts(prodsRes.products || []);
      setCategories(catsRes || []);
      setBrands(brandsRes || []);
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleToggleAvailability = async (productId: string) => {
    try {
      await api.patch(`/admin/products/${productId}/toggle-status`);
      await loadCatalog();
    } catch (err: any) {
      alert(err.message || 'Error toggling availability');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/products', {
        name,
        categoryId,
        brandId,
        price,
        mrp,
        unit,
        meatType,
        isPackaged,
        description: description || `${name} prepared with highest hygiene standards in Kanjikovil.`,
        stock,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=1000&q=85',
        images: imageUrl
          ? [{ id: `img-${Date.now()}`, imageUrl, altText: imageAltText || name, isPrimary: true }]
          : undefined,
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      setImageUrl('');
      setImageAltText('');
      await loadCatalog();
    } catch (err: any) {
      alert(err.message || 'Error adding product');
    }
  };

  // Image Management Actions
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageModalProduct || !newImageUrl) return;

    setImageUploading(true);
    try {
      const res = await api.post(`/admin/products/${imageModalProduct.id}/images`, {
        imageUrl: newImageUrl,
        altText: newImageAlt || imageModalProduct.name,
        isPrimary: newImageIsPrimary,
      });

      setImageModalProduct(res.product);
      setNewImageUrl('');
      setNewImageAlt('');
      setNewImageIsPrimary(false);
      await loadCatalog();
    } catch (err: any) {
      alert(err.message || 'Failed to add image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!imageModalProduct) return;
    try {
      const res = await api.delete(`/admin/products/${imageModalProduct.id}/images/${imageId}`);
      setImageModalProduct(res.product);
      await loadCatalog();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!imageModalProduct) return;
    try {
      const res = await api.patch(`/admin/products/${imageModalProduct.id}/images/${imageId}/primary`);
      setImageModalProduct(res.product);
      await loadCatalog();
    } catch (err: any) {
      alert(err.message || 'Failed to set primary image');
    }
  };

  // File Upload to Data URL (Local Image Selection)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isModal: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isModal) {
        setNewImageUrl(result);
      } else {
        setImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategoryFilter === 'ALL' || p.categoryId === selectedCategoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Product CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Product Catalog & Photo Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage high-resolution meat photography, Sakthi masala packaging, prices, and stock
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-meat-600 hover:bg-meat-700 active:bg-meat-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-meat-600/20 transition flex items-center gap-2 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, cut, or brand..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none min-h-[40px]"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-600">Category:</span>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs font-bold border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-800 focus:outline-none focus:border-meat-600 min-h-[40px]"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Product & Photography</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Brand</th>
                <th className="py-3.5 px-4">Price / MRP</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-center">Photos</th>
                <th className="py-3.5 px-4 text-center">Available</th>
                <th className="py-3.5 px-4 text-right">Manage Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 font-bold">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 font-bold">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const currentStock = p.inventory?.currentStock ?? 20;
                  const isLow = currentStock <= 5;
                  const imageCount = p.images?.length || 1;
                  const primaryImg =
                    p.images?.find((img) => img.isPrimary)?.imageUrl ||
                    p.images?.[0]?.imageUrl ||
                    'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=300&q=80';

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group/thumb w-12 h-12 flex-shrink-0">
                            <img
                              src={primaryImg}
                              alt={p.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=200&q=80';
                              }}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-xs"
                            />
                            {imageCount > 1 && (
                              <span className="absolute -top-1 -right-1 bg-meat-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                                {imageCount}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-gray-400">
                              Unit: {p.unit} • {p.meatType}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {p.category?.name || 'Fresh Chicken'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-meat-700">{p.brand?.name || 'MeatMart'}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-extrabold text-gray-900">₹{p.price}</span>
                        {p.mrp > p.price && (
                          <span className="text-[11px] text-gray-400 line-through ml-1.5">₹{p.mrp}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                            {currentStock} units
                          </span>
                          {isLow && (
                            <span title="Low stock alert">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          <ImageIcon className="w-3 h-3 text-meat-600" />
                          <span>{imageCount}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleAvailability(p.id)}
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition ${
                            p.isAvailable
                              ? 'bg-fresh-100 text-fresh-700 hover:bg-fresh-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title="Toggle availability"
                        >
                          {p.isAvailable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setImageModalProduct(p)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-meat-50 text-meat-700 border border-gray-200 hover:border-meat-200 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition min-h-[36px]"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Photos</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Photos Manager Modal */}
      {imageModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-meat-600" />
                  <span>Product Photography Manager</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{imageModalProduct.name}</p>
              </div>
              <button
                onClick={() => setImageModalProduct(null)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Product Photos Gallery */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Active Photos ({imageModalProduct.images?.length || 0})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageModalProduct.images?.map((img) => (
                  <div
                    key={img.id}
                    className={`relative rounded-2xl overflow-hidden border-2 bg-gray-50 group ${
                      img.isPrimary ? 'border-meat-600 ring-2 ring-meat-100 shadow-sm' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText || imageModalProduct.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-full h-32 object-cover"
                    />

                    {/* Primary Badge */}
                    {img.isPrimary ? (
                      <span className="absolute top-2 left-2 bg-meat-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        <span>Primary</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img.id)}
                        className="absolute top-2 left-2 bg-white/90 hover:bg-white text-gray-700 font-bold text-[10px] px-2 py-0.5 rounded-full shadow transition"
                      >
                        Set Primary
                      </button>
                    )}

                    {/* Delete Photo Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 text-white hover:bg-red-700 transition shadow"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="p-2 text-[10px] text-gray-500 truncate bg-white border-t border-gray-100">
                      {img.altText || 'Product Photo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Photo Form */}
            <form onSubmit={handleAddImage} className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-meat-600" />
                <span>Upload Original Meat Photography</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* File Upload / Camera */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Photo File (JPG / PNG / WebP)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-meat-50 file:text-meat-700 hover:file:bg-meat-100"
                  />
                </div>

                {/* Direct URL Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Or Enter Image URL
                  </label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-meat-600"
                  />
                </div>
              </div>

              {/* Alt Text & Primary Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex-1">
                  <input
                    type="text"
                    value={newImageAlt}
                    onChange={(e) => setNewImageAlt(e.target.value)}
                    placeholder="Descriptive alt text (e.g. Skinless country chicken curry cut on prep board)"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-meat-600"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={newImageIsPrimary}
                    onChange={(e) => setNewImageIsPrimary(e.target.checked)}
                    className="rounded text-meat-600 focus:ring-meat-500 w-4 h-4"
                  />
                  <span>Make Primary Photo</span>
                </label>
              </div>

              {/* Preview if image is chosen */}
              {newImageUrl && (
                <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200">
                  <img src={newImageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Ready to publish
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={imageUploading || !newImageUrl}
                className="w-full min-h-[44px] bg-meat-600 hover:bg-meat-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {imageUploading ? 'Uploading...' : 'Save & Attach Photo to Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900">Add New Product to Store</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Country Chicken Drumsticks"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Brand</label>
                  <select
                    value={brandId}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    required
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  >
                    <option value="kg">kg</option>
                    <option value="500g">500g</option>
                    <option value="250g">250g</option>
                    <option value="packet">packet</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Meat Cut Type</label>
                  <select
                    value={meatType}
                    onChange={(e) => setMeatType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-medium"
                  >
                    <option value="CURRY_CUT">Curry Cut</option>
                    <option value="BIRYANI_CUT">Biryani Cut</option>
                    <option value="BONELESS">Boneless Fillet</option>
                    <option value="CLEANED">Cleaned & Sliced</option>
                    <option value="WHOLE">Whole / Raw</option>
                    <option value="NOT_APPLICABLE">Packaged (Sakthi Masala & Spices)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Photo Input with Live Preview */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="block font-bold text-gray-700">Original Product Photo</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-3 py-2 border rounded-xl"
                  />
                  <label className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  value={imageAltText}
                  onChange={(e) => setImageAltText(e.target.value)}
                  placeholder="Descriptive image alt text"
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />

                {imageUrl && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border">
                    <img src={imageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-[11px] text-gray-500 font-medium truncate flex-1">{imageUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-meat-600 hover:bg-meat-700 text-white font-extrabold py-3 rounded-xl shadow min-h-[44px]"
                >
                  Create & Publish Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 bg-gray-100 font-bold rounded-xl min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
