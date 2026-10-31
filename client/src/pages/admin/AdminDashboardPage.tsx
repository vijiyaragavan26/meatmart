import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  Bike,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/orders'),
        ]);
        setStats(statsRes);
        setRecentOrders(ordersRes.slice(0, 5) || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-meat-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-bold">Loading Dashboard Metrics...</p>
      </div>
    );
  }

  const kpis = [
    { title: "Today's Revenue", value: `₹${stats?.todayRevenue || 0}`, icon: TrendingUp, color: 'text-fresh-600', bg: 'bg-fresh-50' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: Package, color: 'text-meat-600', bg: 'bg-meat-50' },
    { title: 'Active Deliveries', value: stats?.activeDeliveries || 0, icon: Bike, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Low Stock Alerts', value: stats?.lowStockProducts || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-gray-900">Store Operations Overview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Kanjikovil Processing Hub • Erode, Tamil Nadu</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders"
            className="bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition"
          >
            Manage Orders
          </Link>
          <Link
            to="/admin/products"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            Add New Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{kpi.title}</span>
                <div className={`p-2.5 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-gray-900">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Preparation & Pipeline Pipeline Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Pending Acceptance</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-gray-900">{stats?.pendingOrders || 0}</div>
          <p className="text-[11px] text-gray-400">Orders placed by customers awaiting review</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Being Prepared / Cut</span>
            <Package className="w-4 h-4 text-meat-500" />
          </div>
          <div className="text-3xl font-black text-gray-900">{stats?.preparingOrders || 0}</div>
          <p className="text-[11px] text-gray-400">At cutting table & hygiene wash room</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Completed Deliveries</span>
            <CheckCircle2 className="w-4 h-4 text-fresh-500" />
          </div>
          <div className="text-3xl font-black text-gray-900">{stats?.completedOrders || 0}</div>
          <p className="text-[11px] text-gray-400">Successfully delivered with OTP confirmation</p>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-gray-900">Recent Customer Orders</h2>
          <Link to="/admin/orders" className="text-xs text-meat-700 font-bold hover:underline flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wide">
                <th className="py-3 px-3">Order #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium text-gray-800">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3 font-mono font-bold">{ord.orderNumber}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold">{ord.deliveryAddress?.recipientName}</div>
                    <div className="text-[10px] text-gray-400">{ord.deliveryAddress?.area}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="bg-gray-100 text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3">{ord.paymentMethod}</td>
                  <td className="py-3 px-3 text-right font-black text-meat-700">₹{ord.totalAmount}</td>
                  <td className="py-3 px-3 text-center">
                    <Link
                      to={`/tracking/${ord.id}`}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Track
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
