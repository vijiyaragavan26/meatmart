import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  MapPin,
  ChevronRight,
  Printer,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  Clock,
  Bike,
  XCircle,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="bg-fresh-100 text-fresh-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-red-100 text-red-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      case 'OUT_FOR_DELIVERY':
      case 'ARRIVING_SOON':
      case 'PICKED_UP':
        return (
          <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
            <Bike className="w-3.5 h-3.5" />
            <span>On the Way</span>
          </span>
        );
      default:
        return (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{status.replace(/_/g, ' ')}</span>
          </span>
        );
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">My Orders & Invoices</h1>
        <p className="text-xs text-gray-500 mt-1">Track live packages and view invoices</p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-meat-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400 font-bold">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 flex flex-col items-center">
          <Package className="w-12 h-12 text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-900">No orders yet</h3>
          <p className="text-xs text-gray-500 mb-4">Start purchasing fresh chicken cuts or Sakthi masalas today.</p>
          <Link to="/shop" className="bg-meat-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-meat-700">
            Browse Store
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs hover:border-meat-100 transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-gray-900">
                    {order.orderNumber}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Items Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Items:</h4>
                  <ul className="space-y-1 text-gray-600">
                    {order.items?.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity} x {it.productName} ({it.selectedWeight || it.productUnit})
                        </span>
                        <span className="font-semibold text-gray-900">₹{it.totalPrice}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-bold text-gray-800">{order.paymentMethod} ({order.paymentStatus})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Slot:</span>
                    <span className="font-semibold text-gray-800">{order.deliverySlot || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Amount:</span>
                    <span className="text-meat-700 font-extrabold text-sm">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons with >= 44px touch targets on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setSelectedInvoiceOrder(order)}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition active:bg-gray-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>View & Print Invoice</span>
                </button>

                <Link
                  to={`/tracking/${order.id}`}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-meat-600 hover:bg-meat-700 active:bg-meat-800 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <span>Live GPS Tracking</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl print:shadow-none print:max-h-none print:w-full">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-meat-700">MeatMart</h2>
                <p className="text-xs text-gray-500">Main Road, Kanjikovil, Erode - 638116</p>
                <p className="text-xs text-gray-500">Phone: +91 76049 06429</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 block uppercase">Tax Invoice</span>
                <span className="font-mono font-bold text-sm text-gray-900">{selectedInvoiceOrder.orderNumber}</span>
                <p className="text-[11px] text-gray-500">{new Date(selectedInvoiceOrder.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="font-bold text-gray-800">Delivered To:</span>
              <p className="text-gray-600 font-semibold">{selectedInvoiceOrder.deliveryAddress?.recipientName}</p>
              <p className="text-gray-500">{selectedInvoiceOrder.deliveryAddress?.flatHouseNo}, {selectedInvoiceOrder.deliveryAddress?.area}, {selectedInvoiceOrder.deliveryAddress?.pincode}</p>
            </div>

            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 font-bold text-gray-700 bg-gray-50">
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-center">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedInvoiceOrder.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3">
                      <div className="font-bold text-gray-900">{it.productName}</div>
                      <div className="text-[10px] text-gray-400">{it.selectedWeight || it.productUnit}</div>
                    </td>
                    <td className="py-2 px-3 text-center">{it.quantity}</td>
                    <td className="py-2 px-3 text-right">₹{it.unitPrice}</td>
                    <td className="py-2 px-3 text-right font-semibold">₹{it.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-200 pt-3 space-y-1.5 text-xs text-right max-w-xs ml-auto">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{selectedInvoiceOrder.itemTotal}</span>
              </div>
              {selectedInvoiceOrder.discountAmount > 0 && (
                <div className="flex justify-between text-fresh-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{selectedInvoiceOrder.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee:</span>
                <span>₹{selectedInvoiceOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="text-meat-700">₹{selectedInvoiceOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 print:hidden">
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-600"
              >
                Close
              </button>
              <button
                onClick={handlePrintInvoice}
                className="px-5 py-2 bg-meat-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
