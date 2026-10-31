import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, PackageCheck, Bike, Home, AlertCircle } from 'lucide-react';
import { OrderStatus } from '../types';

interface OrderTimelineProps {
  status: OrderStatus;
  timeline?: {
    status: OrderStatus;
    label: string;
    completed: boolean;
    isCurrent?: boolean;
  }[];
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status }) => {
  const { t } = useTranslation();

  const defaultSteps: { status: OrderStatus; labelKey: string; icon: any }[] = [
    { status: 'ORDER_PLACED', labelKey: 'statuses.ORDER_PLACED', icon: Clock },
    { status: 'ORDER_ACCEPTED', labelKey: 'statuses.ORDER_ACCEPTED', icon: CheckCircle2 },
    { status: 'PREPARING', labelKey: 'statuses.PREPARING', icon: PackageCheck },
    { status: 'PACKED', labelKey: 'statuses.PACKED', icon: PackageCheck },
    { status: 'PICKED_UP', labelKey: 'statuses.PICKED_UP', icon: Bike },
    { status: 'OUT_FOR_DELIVERY', labelKey: 'statuses.OUT_FOR_DELIVERY', icon: Bike },
    { status: 'DELIVERED', labelKey: 'statuses.DELIVERED', icon: Home },
  ];

  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-sm">{t('statuses.CANCELLED')}</h4>
          <p className="text-xs text-red-600 mt-0.5">
            This order has been cancelled. Any payment will be automatically refunded to source within 2–4 business days.
          </p>
        </div>
      </div>
    );
  }

  // Calculate current active step index
  const statusOrder: OrderStatus[] = [
    'ORDER_PLACED',
    'PAYMENT_CONFIRMED',
    'ORDER_ACCEPTED',
    'PREPARING',
    'PACKED',
    'DELIVERY_PARTNER_ASSIGNED',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'ARRIVING_SOON',
    'DELIVERED',
  ];

  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting progress bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-fresh-600 transition-all duration-500 z-0"
          style={{
            width: `${
              status === 'DELIVERED'
                ? 100
                : Math.min(100, Math.max(10, (currentIdx / (statusOrder.length - 1)) * 100))
            }%`,
          }}
        />

        {defaultSteps.map((step) => {
          const stepOrderIdx = statusOrder.indexOf(step.status);
          const isCompleted = currentIdx >= stepOrderIdx || status === 'DELIVERED';
          const isCurrent = step.status === status || (step.status === 'OUT_FOR_DELIVERY' && status === 'ARRIVING_SOON');
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-meat-600 text-white ring-4 ring-meat-100 scale-110 shadow-md'
                    : isCompleted
                    ? 'bg-fresh-600 text-white'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`mt-2 text-[11px] font-medium text-center whitespace-nowrap hidden sm:block ${
                  isCurrent ? 'text-meat-700 font-bold' : isCompleted ? 'text-gray-900 font-semibold' : 'text-gray-400'
                }`}
              >
                {t(step.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
