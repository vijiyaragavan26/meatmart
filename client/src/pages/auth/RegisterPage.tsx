import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Globe,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../../i18n';

export const RegisterPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLang, setSelectedLang] = useState(i18n.language || 'en');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Kanjikovil');
  const [pincode, setPincode] = useState('638116');
  const [whatsappConsent, setWhatsappConsent] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = (code: string) => {
    setSelectedLang(code);
    setAppLanguage(code);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phoneNumber.length < 10) {
      setError(t('auth.enterValidPhone'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the MeatMart Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        password,
        address: address.trim() || 'Kanjikovil Main Road',
        area: area.trim() || 'Kanjikovil',
        pincode: pincode.trim() || '638116',
        whatsappConsent,
      });
      // Redirect to protected customer shopping home
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100/70 via-white to-gray-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.svg"
            alt="MeatMart Logo"
            className="h-10 w-10 transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tight text-meat-700 leading-none">
              Meat<span className="text-fresh-600">Mart</span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">
              Kanjikovil • Fresh Meats & Spices
            </span>
          </div>
        </Link>

        <LanguageSelector variant="header" />
      </header>

      {/* Main Registration Content */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 my-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-fresh-50 text-fresh-700 mb-1 shadow-xs">
              <UserPlus className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {t('auth.createAccount')}
            </h1>
            <p className="text-xs text-gray-500">
              Create your account to order farm-fresh cuts in Kanjikovil & Erode
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.fullName')} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Karthik Ramasamy"
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.mobileNumber')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="98765 43210"
                    className="w-full pl-11 pr-3 py-2.5 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('auth.emailOptional')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-8 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.confirmPassword')} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Language Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-meat-600" />
                <span>{t('auth.preferredLanguage')}</span>
              </label>
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery Address & Location */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.deliveryAddress')}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Door No, Street Name, Landmark"
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('auth.area')}
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Kanjikovil"
                    className="w-full px-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('auth.pincode')}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="638116"
                    className="w-full px-3 py-2.5 min-h-[44px] text-xs font-bold border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Consent Option */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
                />
                <div>
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span>📱</span>
                    <span>WhatsApp Order & Tracking Updates</span>
                  </span>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-snug">
                    Receive instant order confirmations, live delivery GPS tracking, and digital invoices on WhatsApp (+91 {phoneNumber || 'XXXXXXXXXX'}).
                  </p>
                </div>
              </label>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  required
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded text-meat-600 focus:ring-meat-500 w-4 h-4 flex-shrink-0"
                />
                <span>{t('auth.termsAgreement')}</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-fresh-600 hover:bg-fresh-700 active:bg-fresh-800 text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-fresh-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{loading ? t('auth.registering') : t('auth.createAccount')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Return to Sign In */}
          <div className="pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/" className="font-extrabold text-meat-700 hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer Assurance */}
      <footer className="py-4 px-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-fresh-600" />
          <span>100% Halal Cuts • RO Water Cleaned • 30–45 Mins Kanjikovil Delivery</span>
        </div>
      </footer>
    </div>
  );
};
