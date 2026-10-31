import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Globe } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-charcoal-900 text-gray-300 pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Store Intro */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="MeatMart" className="h-10 w-10" />
              <span className="text-2xl font-black text-white">
                Meat<span className="text-fresh-500">Mart</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex items-center gap-2 text-xs text-fresh-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Antibiotic & Chemical Residue Free</span>
            </div>
            {/* Quick Language Picker in footer */}
            <div className="pt-2">
              <LanguageSelector variant="header" />
            </div>
          </div>

          {/* Column 2: Quick Categories */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-meat-500 pl-2">
              {t('home.shopByCategory')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/shop?category=fresh-chicken" className="hover:text-white transition">
                  Kanjikovil Country Chicken (Nattu Kozhi)
                </Link>
              </li>
              <li>
                <Link to="/shop?category=chicken-cuts" className="hover:text-white transition">
                  Fresh Broiler Curry Cut
                </Link>
              </li>
              <li>
                <Link to="/shop?category=boneless-chicken" className="hover:text-white transition">
                  Tender Boneless Breast
                </Link>
              </li>
              <li>
                <Link to="/shop?category=chicken-liver-and-cuts" className="hover:text-white transition">
                  Fresh Chicken Liver & Gizzard
                </Link>
              </li>
              <li>
                <Link to="/shop?category=sakthi-masala" className="hover:text-white transition">
                  Sakthi Chicken & Mutton Masalas
                </Link>
              </li>
              <li>
                <Link to="/shop?category=combo-packs-and-offers" className="hover:text-white transition">
                  Weekend Chicken Feast Combos
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Store & Delivery Areas */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-fresh-500 pl-2">
              Store & Delivery Areas
            </h4>
            <div className="space-y-3 text-xs text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-meat-500 flex-shrink-0 mt-0.5" />
                <span>
                  Main Road, Near Bus Stand, Kanjikovil, Erode District, Tamil Nadu — 638116
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Open: 6:30 AM – 9:30 PM (7 Days a week)</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-800">
                <p className="font-semibold text-gray-300 mb-1">Serving PIN Codes:</p>
                <p className="text-[11px] text-gray-400">
                  638116 (Kanjikovil), 638052 (Perundurai), 638102 (Chithode & Bypass)
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Customer Support & Portals */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-l-2 border-amber-500 pl-2">
              Help & Portals
            </h4>
            <div className="space-y-3 text-xs">
              <a href="tel:+917604906429" className="flex items-center gap-2 text-white hover:text-amber-400 transition font-bold">
                <Phone className="w-4 h-4 text-fresh-500" />
                <span>+91 76049 06429</span>
              </a>
              <a href="mailto:support@meatmartkanjikovil.in" className="flex items-center gap-2 hover:text-white transition">
                <Mail className="w-4 h-4 text-meat-500" />
                <span>support@meatmartkanjikovil.in</span>
              </a>

              <div className="pt-3 border-t border-gray-800 flex flex-col gap-1.5">
                <Link to="/delivery" className="text-blue-400 hover:underline">
                  → {t('nav.deliveryPartner')} Portal
                </Link>
                <Link to="/admin" className="text-meat-400 hover:underline">
                  → {t('nav.admin')} Portal
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} MeatMart Kanjikovil. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[11px]">
            <span>Crafted with pride in</span>
            <span className="text-white font-bold">Kanjikovil, Erode</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
