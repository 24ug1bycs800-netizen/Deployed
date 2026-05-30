import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  profilePic?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fullName?: string, profilePic?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('cinecircle_access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await api.get('/auth/profile');
      setUser(response.data.user);
    } catch (err) {
      console.warn("Session expired or invalid, logging out.");
      setUser(null);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: loggedUser } = response.data;
    localStorage.setItem('cinecircle_access_token', accessToken);
    localStorage.setItem('cinecircle_refresh_token', refreshToken);
    setUser(loggedUser);
  };

  const register = async (email: string, password: string, fullName: string) => {
    const response = await api.post('/auth/register', { email, password, fullName });
    const { accessToken, refreshToken, user: newUser } = response.data;
    localStorage.setItem('cinecircle_access_token', accessToken);
    localStorage.setItem('cinecircle_refresh_token', refreshToken);
    setUser(newUser);
  };

  const logout = () => {
  localStorage.removeItem('cinecircle_access_token');
  localStorage.removeItem('cinecircle_refresh_token');
  setUser(null);
  navigate('/auth'); // IMPORTANT FIX
};

  const updateProfile = async (fullName?: string, profilePic?: string) => {
    const response = await api.put('/auth/profile', { fullName, profilePic });
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
