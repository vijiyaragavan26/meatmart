import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Lock, Phone, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const DeliveryLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('9360761595');
  const [password, setPassword] = useState('poopesh@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(phone.trim(), password);
      navigate('/delivery/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check driver credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-gray-100 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Bike className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Delivery Partner Portal</h1>
          <p className="text-xs text-gray-500">MeatMart Kanjikovil Logistics & Route Navigation</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Registered Partner Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">+91</span>
              <input
                type="tel"
                required
                placeholder="9360761595"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Driver Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Authorized Partner:</strong> +91 93607 61595. Phone number is an account contact only and is never tracked independently.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition min-h-[44px]"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Driver Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
