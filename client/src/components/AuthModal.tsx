import React, { useState } from 'react';
import { X, Phone, Lock, User, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginWithOtp, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'otp' | 'register'>('login');

  // Form states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Kanjikovil');
  const [pincode, setPincode] = useState('638116');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(phoneNumber, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneNumber });
      setOtpSent(true);
      if (res.debugOtp) setOtp(res.debugOtp);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithOtp(phoneNumber, otp);
      onClose();
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        fullName,
        phoneNumber,
        email,
        password,
        address,
        area,
        pincode,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-meat-700 to-meat-600 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="MeatMart" className="h-8 w-8 brightness-200" />
            <div>
              <h3 className="font-extrabold text-base leading-tight">Welcome to MeatMart</h3>
              <p className="text-[11px] text-meat-100">Kanjikovil • Fresh Meats & Masalas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 p-1 flex-shrink-0">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2.5 px-2 min-h-[44px] text-xs font-bold rounded-xl transition ${
              tab === 'login' ? 'bg-white text-meat-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => { setTab('otp'); setError(null); }}
            className={`flex-1 py-2.5 px-2 min-h-[44px] text-xs font-bold rounded-xl transition ${
              tab === 'otp' ? 'bg-white text-meat-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            OTP Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2.5 px-2 min-h-[44px] text-xs font-bold rounded-xl transition ${
              tab === 'register' ? 'bg-white text-meat-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Tab 1: Password Login */}
          {tab === 'login' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">+91</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full pl-12 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] bg-meat-600 hover:bg-meat-700 active:bg-meat-800 text-white font-bold text-xs py-3 rounded-xl transition shadow disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Tab 2: OTP Login */}
          {tab === 'otp' && (
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Enter 10-Digit Mobile Number</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">+91</span>
                      <input
                        type="tel"
                        inputMode="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="98765 43210"
                        className="w-full pl-12 pr-3 py-2.5 min-h-[44px] text-xs border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs py-3 rounded-xl transition shadow"
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Enter 6-Digit OTP</label>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-[11px] text-meat-600 hover:underline min-h-[32px] flex items-center"
                      >
                        Change number
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
                      className="w-full text-center tracking-widest text-lg font-bold py-2.5 min-h-[44px] border border-gray-200 rounded-xl focus:border-meat-600 focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">Enter the 6-digit verification code sent to your mobile.</p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs py-3 rounded-xl transition shadow"
                  >
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Tab 3: Customer Registration */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Karthik Ramasamy"
                  className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="karthik@example.com"
                  className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 14, Kaveri Nagar, Main Road"
                  className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Kanjikovil"
                    className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="638116"
                    className="w-full px-3 py-2 min-h-[44px] text-xs border border-gray-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 min-h-[44px] bg-fresh-600 hover:bg-fresh-700 active:bg-fresh-800 text-white font-bold text-xs py-3 rounded-xl transition shadow"
              >
                {loading ? 'Registering...' : 'Create MeatMart Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
