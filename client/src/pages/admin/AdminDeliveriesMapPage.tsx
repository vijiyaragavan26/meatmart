import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bike,
  MapPin,
  Clock,
  ExternalLink,
  RefreshCw,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { LiveMap } from '../../components/LiveMap';
import { api } from '../../services/api';

export const AdminDeliveriesMapPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const loadDeliveries = async () => {
    try {
      const res = await api.get('/admin/deliveries/active');
      setDeliveries(res || []);
      if (res && res.length > 0 && !selectedDelivery) {
        setSelectedDelivery(res[0]);
      }
    } catch (err) {
      console.error('Error fetching active deliveries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Active Delivery Fleet & Route Radar</h1>
          <p className="text-xs text-gray-500 mt-0.5">Real-time GPS monitor of all couriers across Kanjikovil & Erode</p>
        </div>
        <button
          onClick={loadDeliveries}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Fleet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Live Fleet Map */}
        <div className="lg:col-span-2 space-y-4">
          <LiveMap
            storeLocation={{
              name: 'MeatMart Kanjikovil Hub',
              latitude: 11.3925317,
              longitude: 77.6085870,
            }}
            deliveryLocation={{
              address: selectedDelivery?.customerAddress || 'Kanjikovil',
              latitude: Number(selectedDelivery?.destinationCoords?.latitude || 11.3985),
              longitude: Number(selectedDelivery?.destinationCoords?.longitude || 77.6088),
            }}
            partnerLocation={
              selectedDelivery
                ? {
                    latitude: Number(selectedDelivery.partnerCoords.latitude),
                    longitude: Number(selectedDelivery.partnerCoords.longitude),
                  }
                : null
            }
            status={selectedDelivery?.status || 'OUT_FOR_DELIVERY'}
            remainingDistanceKm={2.2}
            estimatedArrivalMinutes={6}
            className="h-[500px] w-full"
            partnerName={selectedDelivery?.partnerName || 'MeatMart Driver'}
          />
        </div>

        {/* Right Col: Active Couriers List */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900">
            Active Trips ({deliveries.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 font-bold">
              Connecting to Fleet...
            </div>
          ) : deliveries.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center text-gray-400">
              <Bike className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-bold text-gray-700">No active deliveries on the road</p>
              <p className="text-[11px] text-gray-400 mt-0.5">New trips will appear when orders are dispatched.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((del) => {
                const isSelected = selectedDelivery?.orderId === del.orderId;

                return (
                  <div
                    key={del.orderId}
                    onClick={() => setSelectedDelivery(del)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-meat-600 bg-meat-50/40 ring-2 ring-meat-100 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-gray-900">{del.orderNumber}</span>
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {del.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-gray-800">
                        <Bike className="w-3.5 h-3.5 text-blue-600" />
                        <span>{del.partnerName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-meat-600" />
                        <span className="truncate">{del.customerAddress}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-[11px]">
                      <span className="text-gray-400">Last GPS: {new Date(del.lastUpdated).toLocaleTimeString()}</span>
                      <Link
                        to={`/tracking/${del.orderId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-meat-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Customer View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
