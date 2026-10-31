import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(phone, password);
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        setError('Access denied. Administrator privileges required.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white flex flex-col justify-between p-4">
      <header className="max-w-md mx-auto w-full pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="MeatMart" className="h-8 w-8" />
          <span className="font-extrabold text-base tracking-tight text-white">
            Meat<span className="text-meat-500">Mart</span> Admin
          </span>
        </Link>
        <Link to="/" className="text-xs text-gray-400 hover:text-white transition">
          Return to Customer Store →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-gray-900/90 rounded-3xl p-8 border border-gray-800 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-meat-600/20 text-meat-500 flex items-center justify-center mx-auto border border-meat-500/30">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Administrator Portal</h1>
            <p className="text-xs text-gray-400">MeatMart Kanjikovil Operations & Inventory Control</p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">+91</span>
                <input
                  type="tel"
                  required
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-3.5 py-3 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-meat-500 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 text-xs bg-gray-800/80 border border-gray-700 text-white rounded-xl focus:outline-none focus:border-meat-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-meat-600 hover:bg-meat-500 active:bg-meat-700 text-white font-extrabold text-xs sm:text-sm py-3.5 rounded-xl shadow-lg shadow-meat-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <footer className="text-center text-[11px] text-gray-600 pb-4">
        Protected System • MeatMart Operations Hub Kanjikovil 638116
      </footer>
    </div>
  );
};

export default AdminLoginPage;
