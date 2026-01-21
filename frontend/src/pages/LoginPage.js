import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { setAuthToken, setCurrentUser } from '../utils/auth';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
      });
      
      const { token, user } = response.data;
      setAuthToken(token);
      setCurrentUser(user);
      
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm mb-4 gold-glow">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-secondary font-bold text-4xl text-[#D4AF37] gold-text-glow mb-2">Wash & Go</h1>
          <p className="text-zinc-400 font-primary">Car Wash POS System</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm p-8">
          <h2 className="font-secondary text-2xl text-white mb-6 text-center">Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="username-input"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                placeholder="Masukkan username"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] rounded-sm text-white placeholder:text-zinc-600 outline-none transition-colors"
                placeholder="Masukkan password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              data-testid="login-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase tracking-wider rounded-sm py-3 transition-colors gold-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-zinc-900/50 rounded-sm border border-zinc-800">
            <p className="text-xs text-zinc-500 text-center mb-2">Demo Credentials:</p>
            <p className="text-xs text-zinc-400 text-center font-mono">Username: admin | Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};