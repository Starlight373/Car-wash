import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Search, Download } from 'lucide-react';
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
import { exportToExcel } from '../utils/excelExport';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_number: '',
    vehicle_type: '',
  });
  
  useEffect(() => {
    fetchCustomers();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.vehicle_number && c.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);
  
  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data customer');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddCustomer = async () => {
    try {
      await api.post('/customers', formData);
      toast.success('Customer berhasil ditambahkan');
      setShowAddDialog(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        vehicle_number: '',
        vehicle_type: '',
      });
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan customer');
    }
  };
  
  const handleExport = () => {
    const exportData = filteredCustomers.map(c => ({
      'Nama': c.name,
      'Telepon': c.phone,
      'Email': c.email || '-',
      'Nomor Kendaraan': c.vehicle_number || '-',
      'Tipe Kendaraan': c.vehicle_type || '-',
      'Total Kunjungan': c.total_visits,
      'Total Belanja': c.total_spending,
      'Tanggal Bergabung': new Date(c.join_date).toLocaleDateString('id-ID'),
    }));
    
    const success = exportToExcel(exportData, `customers-${new Date().toISOString().split('T')[0]}`, 'Customers');
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="customers-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-secondary font-bold text-4xl text-white mb-2">Customers</h1>
            <p className="text-zinc-400">Kelola data pelanggan</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              data-testid="export-customers-button"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              data-testid="add-customer-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Customer
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-customers-input"
              className="pl-12 bg-zinc-900/50 border-zinc-800 text-white"
              placeholder="Cari nama, telepon, atau nomor kendaraan..."
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Email</th>
                  <th>Kendaraan</th>
                  <th>Total Kunjungan</th>
                  <th>Total Belanja</th>
                  <th>Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-semibold text-white">{customer.name}</td>
                    <td className="font-mono text-sm">{customer.phone}</td>
                    <td className="text-sm text-zinc-400">{customer.email || '-'}</td>
                    <td>
                      {customer.vehicle_number ? (
                        <div>
                          <div className="font-semibold text-white text-sm">{customer.vehicle_number}</div>
                          <div className="text-xs text-zinc-500">{customer.vehicle_type}</div>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="font-mono text-center">{customer.total_visits}</td>
                    <td className="font-mono text-[#D4AF37]">Rp {customer.total_spending.toLocaleString('id-ID')}</td>
                    <td className="text-sm text-zinc-400">{new Date(customer.join_date).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                {searchTerm ? 'Tidak ada customer yang ditemukan' : 'Belum ada customer'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tambah Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Nama *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="customer-name-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Telepon *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="customer-phone-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Nomor Kendaraan</Label>
              <Input
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="B 1234 ABC"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Tipe Kendaraan</Label>
              <Input
                value={formData.vehicle_type}
                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Toyota Avanza, Honda CR-V, dll"
              />
            </div>
            <Button
              onClick={handleAddCustomer}
              disabled={!formData.name || !formData.phone}
              data-testid="submit-customer-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              Tambah Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};