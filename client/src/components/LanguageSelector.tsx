import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'header' | 'mobile' | 'footer';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: string) => {
    setAppLanguage(code);
    setIsOpen(false);
  };

  if (variant === 'mobile') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <Globe className="w-4 h-4 text-meat-600" />
          <span>{t('common.selectLanguage')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold min-h-[44px] transition ${
                  isSelected
                    ? 'border-meat-600 bg-meat-50 text-meat-800 ring-2 ring-meat-100 shadow-xs'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <span className="block text-sm font-black">{lang.nativeName}</span>
                  <span className="block text-[10px] text-gray-400 font-medium">{lang.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-meat-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Header Dropdown
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold text-gray-700 hover:text-meat-700 hover:bg-gray-50 border border-gray-200 transition shadow-2xs"
        aria-label="Select Language"
      >
        <Globe className="w-4 h-4 text-meat-600 flex-shrink-0" />
        <span className="font-extrabold">{currentLang.nativeName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-2 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-meat-600" />
            <span>🌐 {t('common.selectLanguage')}</span>
          </div>

          <div className="py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition min-h-[40px] ${
                    isSelected
                      ? 'bg-meat-50 text-meat-800 font-extrabold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-semibold'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold">{lang.nativeName}</span>
                    <span className="block text-[10px] text-gray-400">{lang.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-meat-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
