import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { exportToExcel } from '../utils/excelExport';

const MEMBERSHIP_TYPES = [
  { value: 'regular', label: 'Regular (Point-Based)', price: 0 },
  { value: 'monthly', label: 'All You Can Wash - Bulanan', price: 500000 },
  { value: 'quarterly', label: 'All You Can Wash - 3 Bulanan', price: 1300000 },
  { value: 'biannual', label: 'All You Can Wash - 6 Bulanan', price: 2400000 },
  { value: 'annual', label: 'All You Can Wash - Tahunan', price: 4500000 },
];

export const MembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [price, setPrice] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, expiring, expired
  
  useEffect(() => {
    fetchMemberships();
    fetchCustomers();
  }, []);
  
  useEffect(() => {
    if (selectedType) {
      const typeData = MEMBERSHIP_TYPES.find(t => t.value === selectedType);
      if (typeData) {
        setPrice(typeData.price.toString());
      }
    }
  }, [selectedType]);
  
  const fetchMemberships = async () => {
    try {
      const response = await api.get('/memberships');
      setMemberships(response.data);
    } catch (error) {
      toast.error('Gagal memuat data membership');
    }
  };
  
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data customer');
    }
  };
  
  const handleAddMembership = async () => {
    try {
      await api.post('/memberships', {
        customer_id: selectedCustomerId,
        membership_type: selectedType,
        price: parseFloat(price),
      });
      toast.success('Membership berhasil dibuat');
      setShowAddDialog(false);
      setSelectedCustomerId('');
      setSelectedType('');
      setPrice('');
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuat membership');
    }
  };
  
  const handleExport = () => {
    const exportData = filteredMemberships.map(m => ({
      'Customer': m.customer_name,
      'Tipe Membership': MEMBERSHIP_TYPES.find(t => t.value === m.membership_type)?.label || m.membership_type,
      'Tanggal Mulai': new Date(m.start_date).toLocaleDateString('id-ID'),
      'Tanggal Berakhir': new Date(m.end_date).toLocaleDateString('id-ID'),
      'Status': m.status === 'active' ? 'Aktif' : m.status === 'expiring_soon' ? 'Akan Expire' : 'Expired',
      'Usage Count': m.usage_count,
      'Harga': m.price,
    }));
    
    const success = exportToExcel(exportData, `memberships-${new Date().toISOString().split('T')[0]}`, 'Memberships');
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };
  
  const filteredMemberships = memberships.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expiring_soon': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'expired': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };
  
  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-500/20 text-green-500',
      expiring_soon: 'bg-orange-500/20 text-orange-500',
      expired: 'bg-red-500/20 text-red-500',
    };
    const labels = {
      active: 'Aktif',
      expiring_soon: 'Akan Expire',
      expired: 'Expired',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="memberships-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-secondary font-bold text-4xl text-white mb-2">Memberships</h1>
            <p className="text-zinc-400">Kelola membership pelanggan</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              data-testid="export-memberships-button"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              data-testid="add-membership-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buat Membership
            </Button>
          </div>
        </div>
        
        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'expiring_soon', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              data-testid={`filter-${f}`}
              className={`px-4 py-2 rounded-sm font-medium transition-colors ${
                filter === f 
                  ? 'bg-[#D4AF37] text-black' 
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Semua' : f === 'active' ? 'Aktif' : f === 'expiring_soon' ? 'Akan Expire' : 'Expired'}
            </button>
          ))}
        </div>
        
        {/* Membership Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemberships.map((membership) => {
            const daysRemaining = Math.ceil((new Date(membership.end_date) - new Date()) / (1000 * 60 * 60 * 24));
            
            return (
              <div
                key={membership.id}
                className="bg-[#121214] border border-zinc-800 rounded-sm p-6 hover:border-[#D4AF37]/30 transition-all hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(membership.status)}
                    <h3 className="font-semibold text-white">{membership.customer_name}</h3>
                  </div>
                  {getStatusBadge(membership.status)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Tipe Membership</p>
                    <p className="text-sm font-semibold text-[#D4AF37]">
                      {MEMBERSHIP_TYPES.find(t => t.value === membership.membership_type)?.label || membership.membership_type}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Mulai</p>
                      <p className="text-sm text-white">{new Date(membership.start_date).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider">Berakhir</p>
                      <p className="text-sm text-white">{new Date(membership.end_date).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Sisa Waktu</p>
                    <p className={`text-lg font-mono font-bold ${
                      daysRemaining <= 0 ? 'text-red-500' : 
                      daysRemaining <= 7 ? 'text-orange-500' : 'text-green-500'
                    }`}>
                      {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} hari`}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Usage Count</p>
                    <p className="text-sm font-mono text-white">{membership.usage_count} kali</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Harga</span>
                    <span className="font-mono text-lg font-bold text-[#D4AF37]">
                      Rp {membership.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredMemberships.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Tidak ada membership {filter !== 'all' && `dengan status ${filter}`}
          </div>
        )}
      </div>
      
      {/* Add Membership Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Buat Membership Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Customer *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="select-customer">
                  <SelectValue placeholder="Pilih customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-zinc-400 mb-2">Tipe Membership *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="select-membership-type">
                  <SelectValue placeholder="Pilih tipe membership" />
                </SelectTrigger>
                <SelectContent>
                  {MEMBERSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.price > 0 && `(Rp ${type.price.toLocaleString('id-ID')})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-zinc-400 mb-2">Harga *</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                data-testid="membership-price-input"
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                placeholder="0"
              />
            </div>
            
            <Button
              onClick={handleAddMembership}
              disabled={!selectedCustomerId || !selectedType || !price}
              data-testid="submit-membership-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              Buat Membership
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};