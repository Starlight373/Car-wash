import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { TrendingUp, Users, AlertTriangle, DollarSign, Package, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading...</div>
        </div>
      </Layout>
    );
  }
  
  const statCards = [
    {
      title: 'Revenue Hari Ini',
      value: `Rp ${(stats?.today_revenue || 0).toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'from-[#D4AF37] to-[#F59E0B]',
      testId: 'today-revenue'
    },
    {
      title: 'Transaksi Hari Ini',
      value: stats?.today_transactions || 0,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      testId: 'today-transactions'
    },
    {
      title: 'Member Aktif',
      value: stats?.active_memberships || 0,
      icon: CreditCard,
      color: 'from-blue-500 to-blue-600',
      testId: 'active-memberships'
    },
    {
      title: 'Member Akan Expired',
      value: stats?.expiring_memberships || 0,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      testId: 'expiring-memberships'
    },
    {
      title: 'Stok Menipis',
      value: stats?.low_stock_items || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      testId: 'low-stock-items'
    },
  ];
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="dashboard-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-secondary font-bold text-4xl text-white mb-2">Dashboard</h1>
          <p className="text-zinc-400 font-primary">Overview performa bisnis hari ini</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                data-testid={card.testId}
                className="bg-[#121214] border border-zinc-800 rounded-sm p-6 hover:border-[#D4AF37]/30 transition-all duration-300 hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-sm flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-2">{card.title}</h3>
                <p className="font-mono font-bold text-3xl text-white">{card.value}</p>
              </div>
            );
          })}
        </div>
        
        {/* Kasir Performance */}
        {stats?.kasir_performance && Object.keys(stats.kasir_performance).length > 0 && (
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <h2 className="font-secondary text-2xl text-white mb-6">Performa Kasir Hari Ini</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.kasir_performance).map(([name, data]) => (
                <div key={name} className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-2">{name}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-white">{data.count} transaksi</p>
                      <p className="font-mono text-sm text-[#D4AF37]">Rp {data.revenue.toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};