import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { api } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phoneNumber.length < 10) {
      setError(t('auth.enterValidPhone'));
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneNumber: phoneNumber.trim() });
      setStep('reset');
      if (res.debugOtp) {
        setOtp(res.debugOtp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP to this number.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(t('auth.passwordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(phoneNumber.trim(), otp.trim(), newPassword);
      setSuccessMsg(res.message || 'Password reset successfully! You can now sign in.');
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check the OTP.');
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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-meat-700 font-bold min-h-[36px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('common.back')} to Sign In</span>
          </Link>

          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-meat-50 text-meat-600 mb-1 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {t('auth.resetPasswordTitle')}
            </h1>
            <p className="text-xs text-gray-500">
              {t('auth.resetPasswordSubtitle')}
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium animate-in fade-in">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-fresh-50 border border-fresh-200 text-fresh-900 text-xs rounded-2xl font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-fresh-600 flex-shrink-0" />
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          {step === 'request' && !successMsg && (
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                    className="w-full pl-12 pr-4 py-3 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-meat-600 hover:bg-meat-700 text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-meat-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? t('auth.sendingOtp') : t('auth.sendOtp')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'reset' && !successMsg && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">
                    {t('auth.enterOtp6')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('request')}
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
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  autoFocus
                  className="w-full text-center tracking-widest text-xl font-black py-3 min-h-[48px] border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-3 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-3 py-3 min-h-[44px] text-xs font-semibold border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] bg-fresh-600 hover:bg-fresh-700 text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-fresh-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <span>{loading ? 'Resetting...' : t('auth.resetPasswordBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-gray-100 text-center">
            <Link to="/" className="text-xs font-bold text-meat-700 hover:underline">
              Return to Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-xs text-gray-400 border-t border-gray-100 bg-white">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <ShieldCheck className="w-4 h-4 text-fresh-600" />
          <span>Secure Password Recovery • MeatMart Kanjikovil</span>
        </div>
      </footer>
    </div>
  );
};
