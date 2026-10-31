import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CustomerAddress } from '../types';
import { api } from '../services/api';
import { updateSocketAuth } from '../services/socket';

interface AuthContextType {
  user: User | null;
  addresses: CustomerAddress[];
  token: string | null;
  isLoading: boolean;
  login: (phoneNumber: string, password: string) => Promise<User>;
  loginWithOtp: (phoneNumber: string, otp: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  resetPassword: (phoneNumber: string, otp: string, newPassword: string) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  addAddress: (addressData: any) => Promise<CustomerAddress>;
  isCustomer: boolean;
  isDeliveryPartner: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('meatmart_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const activeToken = localStorage.getItem('meatmart_token');
      if (!activeToken) {
        setUser(null);
        setAddresses([]);
        setIsLoading(false);
        return;
      }

      const res = await api.get('/auth/me');
      setUser({
        id: res.id,
        fullName: res.fullName,
        phoneNumber: res.phoneNumber,
        email: res.email,
        role: res.role,
        isActive: res.isActive,
        avatarUrl: res.avatarUrl,
      });
      setAddresses(res.addresses || []);
    } catch (err) {
      console.warn('Failed to load authenticated user profile:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (phoneNumber: string, password: string) => {
    const res = await api.post('/auth/login', { phoneNumber, password });
    localStorage.setItem('meatmart_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.addresses) setAddresses(res.addresses);
    setIsLoading(false);
    updateSocketAuth(res.token);
    return res.user;
  };

  const loginWithOtp = async (phoneNumber: string, otp: string) => {
    const res = await api.post('/auth/verify-otp', { phoneNumber, otp });
    localStorage.setItem('meatmart_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.addresses) setAddresses(res.addresses);
    setIsLoading(false);
    updateSocketAuth(res.token);
    return res.user;
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('meatmart_token', res.token);
    setToken(res.token);
    setUser(res.user);
    if (res.addresses) setAddresses(res.addresses);
    setIsLoading(false);
    updateSocketAuth(res.token);
    return res.user;
  };

  const resetPassword = async (phoneNumber: string, otp: string, newPassword: string) => {
    const res = await api.post('/auth/reset-password', { phoneNumber, otp, newPassword });
    return res;
  };

  const logout = () => {
    localStorage.removeItem('meatmart_token');
    setToken(null);
    setUser(null);
    setAddresses([]);
    updateSocketAuth(null);
  };

  const addAddress = async (addressData: any) => {
    const res = await api.post('/auth/addresses', addressData);
    setAddresses(prev => [...prev, res.address]);
    await refreshUser();
    return res.address;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        addresses,
        token,
        isLoading,
        login,
        loginWithOtp,
        register,
        resetPassword,
        logout,
        refreshUser,
        addAddress,
        isCustomer: user?.role === 'CUSTOMER',
        isDeliveryPartner: user?.role === 'DELIVERY_PARTNER',
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
