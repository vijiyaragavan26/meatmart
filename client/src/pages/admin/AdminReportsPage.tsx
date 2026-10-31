import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, ShoppingBag, Download, Calendar } from 'lucide-react';
import { api } from '../../services/api';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await api.get('/admin/reports');
        setReports(res);
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-meat-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-bold">Generating Sales Reports...</p>
      </div>
    );
  }

  const categorySales = reports?.categorySales || {};

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Sales Reports & Business Intelligence</h1>
          <p className="text-xs text-gray-500 mt-0.5">Aggregated revenue, cut popularity, and inventory movement</p>
        </div>
        <button
          onClick={() => window.print()}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Gross Platform Sales</span>
          <div className="text-3xl font-black text-meat-700">₹{reports?.totalSales || 0}</div>
          <span className="text-[11px] text-fresh-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kanjikovil Hub Active</span>
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Dispatched Orders</span>
          <div className="text-3xl font-black text-gray-900">{reports?.totalOrders || 0}</div>
          <span className="text-[11px] text-gray-400 font-medium">Delivered & confirmed</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Average Order Value (AOV)</span>
          <div className="text-3xl font-black text-gray-900">₹{reports?.averageOrderValue || 0}</div>
          <span className="text-[11px] text-gray-400 font-medium">Per household order</span>
        </div>
      </div>

      {/* Category Breakdown & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Share */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <PieChart className="w-5 h-5 text-meat-600" />
            <h2 className="text-sm font-black text-gray-900">Sales by Product Category</h2>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(categorySales).length === 0 ? (
              <p className="text-xs text-gray-400">No category sales recorded yet.</p>
            ) : (
              Object.entries(categorySales).map(([cat, val]: [string, any]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-800">
                    <span>{cat}</span>
                    <span className="text-meat-700">₹{val}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-meat-600 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (val / (reports?.totalSales || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Best Sellers */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <ShoppingBag className="w-5 h-5 text-fresh-600" />
            <h2 className="text-sm font-black text-gray-900">Top Performing Products</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {reports?.bestSellers?.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={p.images?.[0]?.imageUrl}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block">{p.name}</span>
                    <span className="text-[11px] text-gray-400">{p.unit} • {p.brand?.name || 'MeatMart'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-meat-700 block text-sm">₹{p.price}</span>
                  <span className="text-[10px] text-fresh-700 font-bold">★ {p.averageRating} ({p.totalReviews})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
