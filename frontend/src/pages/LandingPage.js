import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, CheckCircle, Clock, Award, Shield, Droplets, ArrowRight, Phone, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const LandingPage = () => {
  const [services, setServices] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCheckMembership, setShowCheckMembership] = useState(false);
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/public/services`);
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };
  
  const handleCheckMembership = async () => {
    if (!phoneNumber) {
      toast.error('Masukkan nomor telepon');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/public/check-membership?phone=${phoneNumber}`);
      setMembershipData(response.data);
      toast.success('Data membership ditemukan!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Nomor telepon tidak terdaftar');
      } else {
        toast.error('Gagal mengecek membership');
      }
      setMembershipData(null);
    } finally {
      setLoading(false);
    }
  };
  
  const features = [
    {
      icon: Droplets,
      title: 'Premium Quality',
      description: 'Menggunakan produk berkualitas tinggi untuk hasil maksimal'
    },
    {
      icon: Clock,
      title: 'Fast Service',
      description: 'Layanan cepat mulai dari 20 menit'
    },
    {
      icon: Shield,
      title: 'Professional Team',
      description: 'Tim berpengalaman dan terlatih'
    },
    {
      icon: Award,
      title: 'Membership Benefits',
      description: 'All You Can Wash dengan harga terjangkau'
    }
  ];
  
  const membershipTypes = [
    { name: 'Bulanan', duration: '30 hari', price: 'Rp 500.000', saves: 'Hemat 40%' },
    { name: '3 Bulanan', duration: '90 hari', price: 'Rp 1.300.000', saves: 'Hemat 50%' },
    { name: '6 Bulanan', duration: '180 hari', price: 'Rp 2.400.000', saves: 'Hemat 55%' },
    { name: 'Tahunan', duration: '365 hari', price: 'Rp 4.500.000', saves: 'Hemat 60%' }
  ];
  
  return (
    <div className="min-h-screen bg-[#09090B]">
      {/* Header/Navbar */}
      <nav className="fixed top-0 w-full bg-[#121214]/80 backdrop-blur-xl border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="font-secondary font-bold text-xl text-[#D4AF37]">Wash & Go</h1>
              <p className="text-xs text-zinc-500">Premium Car Wash</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowCheckMembership(!showCheckMembership)}
              data-testid="check-membership-toggle"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Cek Membership
            </Button>
            <Button
              onClick={() => navigate('/login')}
              data-testid="login-nav-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold"
            >
              Login Staff
            </Button>
          </div>
        </div>
      </nav>
      
      {/* Check Membership Section */}
      {showCheckMembership && (
        <div className="fixed top-20 right-6 w-96 bg-[#121214] border border-zinc-800 rounded-sm p-6 z-40 animate-fade-in shadow-xl">
          <h3 className="font-secondary text-xl text-white mb-4">Cek Status Membership</h3>
          <p className="text-sm text-zinc-400 mb-4">Masukkan nomor telepon yang terdaftar</p>
          <div className="space-y-3">
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              data-testid="phone-check-input"
              className="bg-zinc-900/50 border-zinc-800 text-white"
              placeholder="08xxxxxxxxxx"
              onKeyPress={(e) => e.key === 'Enter' && handleCheckMembership()}
            />
            <Button
              onClick={handleCheckMembership}
              disabled={loading}
              data-testid="check-membership-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-semibold"
            >
              {loading ? 'Mencari...' : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Cek Membership
                </>
              )}
            </Button>
          </div>
          
          {/* Membership Result */}
          {membershipData && (
            <div className="mt-4 space-y-3" data-testid="membership-result">
              <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-1">Nama</p>
                <p className="font-semibold text-white">{membershipData.customer.name}</p>
              </div>
              
              {membershipData.memberships.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-400">Membership Aktif:</p>
                  {membershipData.memberships.map((m) => (
                    <div key={m.id} className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-[#D4AF37]">
                          {m.membership_type.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          m.status === 'active' ? 'bg-green-500/20 text-green-500' :
                          m.status === 'expiring_soon' ? 'bg-orange-500/20 text-orange-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {m.status === 'active' ? 'Aktif' : m.status === 'expiring_soon' ? 'Akan Expire' : 'Expired'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Berakhir:</span>
                          <span className="text-white font-mono">
                            {new Date(m.end_date).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sisa Waktu:</span>
                          <span className={`font-mono font-bold ${
                            m.days_remaining <= 0 ? 'text-red-500' :
                            m.days_remaining <= 7 ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {m.days_remaining} hari
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Sudah digunakan:</span>
                          <span className="text-white font-mono">{m.usage_count} kali</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800 text-center">
                  <p className="text-sm text-zinc-400">Belum memiliki membership aktif</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm mb-6 gold-glow">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-secondary font-bold text-5xl md:text-7xl text-white mb-6 gold-text-glow">
            Premium Car Wash
            <span className="text-[#D4AF37]"> Experience</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Layanan cuci mobil premium dengan teknologi modern dan tim profesional.
            Mobil Anda layak mendapatkan perawatan terbaik.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => document.getElementById('membership').scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase px-8 py-6 text-lg"
            >
              Lihat Paket Membership
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 bg-[#121214]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-secondary font-bold text-4xl text-white text-center mb-12">Mengapa Pilih Kami?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-[#09090B] border border-zinc-800 rounded-sm p-6 hover:border-[#D4AF37]/50 transition-all hover-lift">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-secondary font-bold text-4xl text-white text-center mb-12">Layanan Kami</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.slice(0, 6).map((service) => (
              <div key={service.id} className="bg-[#121214] border border-zinc-800 rounded-sm p-6 hover:border-[#D4AF37]/30 transition-all hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-white">{service.name}</h3>
                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">{service.category}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-4">{service.description || 'Layanan premium untuk kendaraan Anda'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="font-mono text-xl font-bold text-[#D4AF37]">
                    Rp {service.price.toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs text-zinc-500">{service.duration_minutes} menit</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Membership Section */}
      <section id="membership" className="py-20 px-6 bg-[#121214]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-secondary font-bold text-4xl text-white mb-4">Paket Membership</h2>
            <p className="text-xl text-zinc-400">All You Can Wash - Cuci sepuasnya dengan harga hemat!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {membershipTypes.map((type, index) => (
              <div key={index} className="bg-[#09090B] border border-zinc-800 rounded-sm p-6 hover:border-[#D4AF37]/50 transition-all hover-lift relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-[#D4AF37] text-black rounded-full text-xs font-bold">
                    {type.saves}
                  </span>
                </div>
                <h3 className="font-secondary text-2xl font-bold text-white mb-2">{type.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{type.duration}</p>
                <div className="mb-6">
                  <p className="font-mono text-3xl font-bold text-[#D4AF37]">{type.price}</p>
                  <p className="text-xs text-zinc-500 mt-1">Unlimited wash</p>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Cuci tanpa batas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    1x per hari
                  </li>
                  <li className="flex items-center gap-2 text-sm text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Semua layanan basic
                  </li>
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-zinc-500">* Untuk pendaftaran membership, silakan hubungi outlet kami</p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="font-secondary font-bold text-xl text-[#D4AF37]">Wash & Go</h1>
                  <p className="text-xs text-zinc-500">Premium Car Wash</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400">Layanan cuci mobil premium dengan standar internasional.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Kontak</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>Telepon: 021-12345678</li>
                <li>Email: info@washngo.com</li>
                <li>WhatsApp: 0812-3456-7890</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Alamat</h4>
              <p className="text-sm text-zinc-400">
                Jl. Sudirman No. 123<br />
                Jakarta Pusat, 10220<br />
                Indonesia
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-sm text-zinc-500">
            © 2025 Wash & Go. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};