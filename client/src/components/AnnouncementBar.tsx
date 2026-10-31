import React from 'react';
import { useTranslation } from 'react-i18next';
import { Truck, Clock, Phone, Sparkles } from 'lucide-react';

export const AnnouncementBar: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-meat-900 text-white text-xs py-2 px-4 border-b border-meat-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Truck className="w-4 h-4 text-fresh-400 flex-shrink-0" />
          <span>
            {t('home.announcement')}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-[11px] text-gray-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>6:30 AM – 9:30 PM Daily</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-fresh-400" />
            <span>Coupon <strong>MEATFIRST</strong> (-₹50)</span>
          </div>
          <a href="tel:+917604906429" className="flex items-center gap-1 text-white hover:text-amber-300 transition">
            <Phone className="w-3.5 h-3.5 text-fresh-400" />
            <span>+91 76049 06429</span>
          </a>
        </div>
      </div>
    </div>
  );
};
