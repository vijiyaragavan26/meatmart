import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ShoppingBag,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { api } from '../../services/api';

export const SignInPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loginWithOtp, isLoading } = useAuth();

  // If already logged in, redirect to intended portal
  if (user) {
    if (user.role === 'DELIVERY_PARTNER') {
      return <Navigate to="/delivery/dashboard" replace />;
    }
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    const from = (location.state as any)?.from?.pathname || '/home';
    return <Navigate to={from} replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-meat-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [whatsappDirectUrl, setWhatsappDirectUrl] = useState<string | null>(null);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber || phoneNumber.length < 10) {
      setError(t('auth.enterValidPhone'));
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(phoneNumber.trim(), password);
      if (loggedUser.role === 'DELIVERY_PARTNER') {
        navigate('/delivery/dashboard', { replace: true });
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/home';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber || phoneNumber.length < 10) {
      setError(t('auth.enterValidPhone'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneNumber: phoneNumber.trim() });
      setOtpSent(true);
      if (res.whatsappDirectUrl) {
        setWhatsappDirectUrl(res.whatsappDirectUrl);
      }
      if (res.otp || res.debugOtp) {
        setReceivedOtp(res.otp || res.debugOtp);
        setOtpInput(res.otp || res.debugOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedUser = await loginWithOtp(phoneNumber.trim(), otpInput.trim());
      if (loggedUser.role === 'DELIVERY_PARTNER') {
        navigate('/delivery/dashboard', { replace: true });
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/home';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-100/70 via-white to-gray-50 flex flex-col justify-between">
      {/* Top Navigation Bar with Logo and Language Selector */}
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

        {/* Global Language Selector (Works before login) */}
        <LanguageSelector variant="header" />
      </header>

      {/* Main Centered Sign-In Content */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
          {/* Welcome Heading */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-meat-50 text-meat-600 mb-1 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {t('auth.welcome')}
            </h1>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* Mode Switcher: Password vs OTP */}
          <div className="flex bg-gray-100 p-1 rounded-2xl text-xs font-bold gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition min-h-[44px] ${
                authMode === 'password'
                  ? 'bg-white text-meat-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('auth.passwordLogin')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition min-h-[44px] ${
                authMode === 'otp'
                  ? 'bg-white text-meat-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t('auth.otpLogin')}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {/* Password Login Form */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {t('auth.mobileNumber')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
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
                    className="w-full pl-12 pr-4 py-3 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:ring-2 focus:ring-meat-100 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    {t('auth.enterPassword')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-meat-700 hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:ring-2 focus:ring-meat-100 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-meat-600 focus:ring-meat-500 w-4 h-4"
                  />
                  <span className="font-medium">{t('auth.rememberMe')}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-meat-600 hover:bg-meat-700 active:bg-meat-800 text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-meat-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? t('auth.loggingIn') : t('auth.signIn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* OTP Login Form */}
          {authMode === 'otp' && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      {t('auth.enterMobile10')}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
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
                        className="w-full pl-12 pr-4 py-3 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] bg-meat-600 hover:bg-meat-700 text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-meat-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <span>{loading ? t('auth.sendingOtp') : t('auth.sendOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700">
                        {t('auth.enterOtp6')}
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] font-bold text-meat-700 hover:underline min-h-[32px] flex items-center"
                      >
                        {t('auth.changeNumber')}
                      </button>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="123456"
                      autoFocus
                      className="w-full text-center tracking-widest text-xl font-black py-3 min-h-[48px] border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1.5 text-center">
                      Enter the 6-digit OTP code sent to your mobile via WhatsApp / SMS.
                    </p>
                  </div>

                  {/* 1-Click WhatsApp Direct Open Button */}
                  {whatsappDirectUrl && (
                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] bg-[#25D366] hover:bg-[#1EBE5D] text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>📲 Click to Open Code in WhatsApp</span>
                    </a>
                  )}

                  {/* Live On-Screen Notification Alert */}
                  {receivedOtp && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-emerald-800 block text-[11px]">💬 WhatsApp & Gmail Verification Code:</span>
                        <span className="font-mono text-base font-black tracking-widest text-emerald-950">{receivedOtp}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpInput(receivedOtp)}
                        className="bg-emerald-600 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg hover:bg-emerald-700 min-h-[32px] transition"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] bg-fresh-600 hover:bg-fresh-700 text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-fresh-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <span>{loading ? t('auth.verifying') : t('auth.verifyContinue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Continue as Guest Button */}
          <div className="pt-2">
            <Link
              to="/home"
              className="inline-flex items-center justify-center gap-2 w-full min-h-[46px] py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold text-xs transition border border-gray-200 shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-meat-600" />
              <span>🛍️ Explore MeatMart Cuts as Guest</span>
            </Link>
          </div>

          {/* Link to Registration */}
          <div className="pt-2 border-t border-gray-100 text-center space-y-3">
            <p className="text-xs text-gray-500">
              Don't have an account yet?
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center w-full min-h-[44px] py-2.5 px-4 rounded-xl border-2 border-meat-600 text-meat-700 font-extrabold text-xs hover:bg-meat-50 transition"
            >
              {t('auth.createNewAccount')}
            </Link>
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
