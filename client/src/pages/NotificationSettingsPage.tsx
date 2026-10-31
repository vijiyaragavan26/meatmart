import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Check,
  ArrowLeft,
  KeyRound,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface NotificationPreferences {
  whatsappOrderUpdates: boolean;
  whatsappPromos: boolean;
  emailReceipts: boolean;
  emailPromos: boolean;
  smsAlerts: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export const NotificationSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPreferences>({
    whatsappOrderUpdates: true,
    whatsappPromos: false,
    emailReceipts: true,
    emailPromos: false,
    smsAlerts: true,
    isEmailVerified: false,
    isPhoneVerified: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email verification modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState(user?.email || '');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Load preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const data = await api.get('/notifications/preferences');
      setPrefs({
        whatsappOrderUpdates: Boolean(data.whatsappOrderUpdates),
        whatsappPromos: Boolean(data.whatsappPromos),
        emailReceipts: Boolean(data.emailReceipts),
        emailPromos: Boolean(data.emailPromos),
        smsAlerts: Boolean(data.smsAlerts),
        isEmailVerified: Boolean(data.isEmailVerified),
        isPhoneVerified: Boolean(data.isPhoneVerified),
      });
      if (user?.email && !targetEmail) {
        setTargetEmail(user.email);
      }
    } catch (err: any) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSaveSuccess(false);
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await api.patch('/notifications/preferences', prefs);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendEmailOtp = async () => {
    if (!targetEmail || !targetEmail.includes('@')) {
      setOtpError('Please provide a valid email address.');
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);
    try {
      const res = await api.post('/notifications/send-email-otp', { email: targetEmail });
      setOtpSent(true);
      setOtpSuccess(res.message || 'Verification code sent to your email.');
      if (res.otp || res.debugOtp) {
        setEmailOtp(res.otp || res.debugOtp);
      }
      setCooldownSeconds(res.resendIn || 60);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send verification code.');
      if (err.cooldownSeconds) {
        setCooldownSeconds(err.cooldownSeconds);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const res = await api.post('/notifications/verify-email-otp', {
        email: targetEmail,
        otp: emailOtp,
      });

      setOtpSuccess(res.message || 'Email verified successfully!');
      setPrefs(prev => ({ ...prev, isEmailVerified: true }));
      setTimeout(() => {
        setIsEmailModalOpen(false);
        setOtpSent(false);
        setEmailOtp('');
        setOtpSuccess(null);
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/70 pb-20 pt-4 sm:pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs text-gray-500">
          <Link to="/home" className="hover:text-meat-600 transition">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">Notification Settings</span>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-meat-50 text-meat-600 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Notification Preferences
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Manage how MeatMart updates you about fresh poultry, delivery tracking, and receipts.
              </p>
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={saving || loading}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-meat-600 hover:bg-meat-700 active:bg-meat-800 text-white shadow-meat-600/20'
            }`}
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>

        {/* Success / Error alerts */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Your notification preferences have been saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Mobile Verification Status */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Mobile Number
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <p className="text-base font-extrabold text-gray-900">
                +91 {user?.phoneNumber || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Used for instant WhatsApp delivery links, login verification, and delivery OTPs.
              </p>
            </div>
          </div>

          {/* Email Verification Status */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Email Address
                </span>
                {prefs.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-base font-extrabold text-gray-900 truncate">
                {user?.email || 'No email registered yet'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Itemized GST tax invoices, payment receipts, and order summaries are sent here.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              {!prefs.isEmailVerified ? (
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(true)}
                  className="text-xs font-extrabold text-meat-600 hover:text-meat-700 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify Email Address Now</span>
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">Authenticated and active for email alerts</span>
              )}
            </div>
          </div>
        </div>

        {/* Channel Preferences Sections */}
        <div className="space-y-4">
          {/* Section 1: WhatsApp Business Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-emerald-50/40 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900">
                  WhatsApp Business Platform
                </h2>
                <p className="text-xs text-gray-500">
                  Official WhatsApp Cloud API notifications delivered to your phone (+91).
                </p>
              </div>
            </div>

            <div className="p-5 divide-y divide-gray-100">
              {/* WhatsApp Order & Tracking */}
              <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                    Order Updates & Live GPS Tracking
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Order confirmations, butcher prep status, delivery partner assignment, and 4-digit delivery OTP.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.whatsappOrderUpdates}
                    onChange={() => handleToggle('whatsappOrderUpdates')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* WhatsApp Promos */}
              <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                    Weekend Cuts & Fresh Farm Offers
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Exclusive coupon codes and alerts when country chicken (Nattu Kozhi) or special Sakthi masala batches arrive.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.whatsappPromos}
                    onChange={() => handleToggle('whatsappPromos')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Email Notifications */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-red-50/40 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-meat-600 text-white flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900">
                  Transactional Email (Gmail / SMTP)
                </h2>
                <p className="text-xs text-gray-500">
                  Formatted HTML invoices and security alerts sent directly to your inbox.
                </p>
              </div>
            </div>

            <div className="p-5 divide-y divide-gray-100">
              {/* Email Invoices */}
              <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                    Digital Invoices & Payment Receipts
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Itemized order receipt with pricing breakdown, delivery partner contact, and payment reference.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.emailReceipts}
                    onChange={() => handleToggle('emailReceipts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-meat-600"></div>
                </label>
              </div>

              {/* Email Weekly Specials */}
              <div className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                    Weekly MeatMart Newsletter & Recipes
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kongu Nadu cooking guides, Sakthi Masala chicken curry tips, and seasonal culinary highlights.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.emailPromos}
                    onChange={() => handleToggle('emailPromos')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-meat-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: SMS Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-800 text-white flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900">
                  SMS Text Alerts
                </h2>
                <p className="text-xs text-gray-500">
                  High-priority SMS delivery failover in case of mobile data disconnection.
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800">
                    Critical Delivery SMS Failover
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Receive an SMS if your WhatsApp is offline during active delivery in Kanjikovil.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={prefs.smsAlerts}
                    onChange={() => handleToggle('smsAlerts')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSavePreferences}
            disabled={saving || loading}
            className="w-full sm:w-auto min-h-[48px] px-8 py-3 bg-meat-600 hover:bg-meat-700 active:bg-meat-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-meat-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Preferences...' : 'Save Notification Preferences'}</span>
          </button>
        </div>
      </div>

      {/* Email Verification Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsEmailModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 text-meat-600 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
              Verify Your Email Address
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-5">
              We'll send a 6-digit verification code to confirm ownership of this inbox.
            </p>

            {otpError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    disabled={otpSent}
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="flex-1 px-3.5 py-2.5 min-h-[44px] text-xs sm:text-sm border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none disabled:bg-gray-50"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={sendingOtp || !targetEmail}
                      className="px-4 py-2.5 bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs rounded-xl min-h-[44px] flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      {sendingOtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Send OTP</span>
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      Enter 6-Digit Code
                    </label>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={cooldownSeconds > 0 || sendingOtp}
                      className="text-xs font-extrabold text-meat-600 hover:text-meat-700 disabled:text-gray-400"
                    >
                      {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend Code'}
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center text-xl font-mono font-bold tracking-widest py-3 border-2 border-meat-500 rounded-xl focus:outline-none"
                  />
                  <p className="text-[11px] text-gray-500 mt-1 text-center">
                    Code valid for 5 minutes. Check your inbox and spam folder.
                  </p>

                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    disabled={verifyingOtp || emailOtp.length < 6}
                    className="w-full mt-4 min-h-[44px] bg-fresh-600 hover:bg-fresh-700 active:bg-fresh-800 text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verifyingOtp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{verifyingOtp ? 'Verifying Code...' : 'Confirm Email Verification'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPage;
