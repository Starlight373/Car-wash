import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Search, Download, Pencil, Trash2, Eye, X } from 'lucide-react';
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
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  
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
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicle_number: '',
      vehicle_type: '',
    });
  };
  
  const handleAddCustomer = async () => {
    setLoading(true);
    try {
      await api.post('/customers', formData);
      toast.success('Customer berhasil ditambahkan');
      setShowAddDialog(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan customer');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      vehicle_number: customer.vehicle_number || '',
      vehicle_type: customer.vehicle_type || '',
    });
    setShowEditDialog(true);
  };
  
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/customers/${editingCustomer.id}`, formData);
      toast.success('Customer berhasil diupdate');
      setShowEditDialog(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update customer');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetail = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailDialog(true);
    
    try {
      const response = await api.get(`/customers/${customer.id}/transactions`);
      setCustomerTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setCustomerTransactions([]);
    }
  };
  
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      toast.success('Customer berhasil dihapus');
      setDeleteTarget(null);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus customer');
    } finally {
      setLoading(false);
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
  
  const renderFormFields = () => (
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
    </div>
  );
  
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
              onClick={() => { resetForm(); setShowAddDialog(true); }}
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
                  <th>Aksi</th>
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
                    <td>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleViewDetail(customer)}
                          size="sm"
                          variant="ghost"
                          data-testid={`view-${customer.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-[#D4AF37]"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleEdit(customer)}
                          size="sm"
                          variant="ghost"
                          data-testid={`edit-${customer.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setDeleteTarget(customer)}
                          size="sm"
                          variant="ghost"
                          data-testid={`delete-${customer.id}`}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
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
          {renderFormFields()}
          <Button
            onClick={handleAddCustomer}
            disabled={loading || !formData.name || !formData.phone}
            data-testid="submit-customer-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
          >
            {loading ? 'Menyimpan...' : 'Tambah Customer'}
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Edit Customer</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <Button
            onClick={handleSaveEdit}
            disabled={loading || !formData.name || !formData.phone}
            data-testid="save-edit-customer-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Customer Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Detail Customer</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Nama</p>
                  <p className="text-white font-semibold">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Telepon</p>
                  <p className="text-white font-mono">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Email</p>
                  <p className="text-white">{selectedCustomer.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Kendaraan</p>
                  <p className="text-white">
                    {selectedCustomer.vehicle_number || '-'}
                    {selectedCustomer.vehicle_type && ` (${selectedCustomer.vehicle_type})`}
                  </p>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Kunjungan</p>
                  <p className="font-mono text-2xl font-bold text-white">{selectedCustomer.total_visits}</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Belanja</p>
                  <p className="font-mono text-xl font-bold text-[#D4AF37]">
                    Rp {selectedCustomer.total_spending.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Bergabung</p>
                  <p className="text-white">{new Date(selectedCustomer.join_date).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              
              {/* Transaction History */}
              <div>
                <h3 className="font-secondary text-lg text-white mb-3">Riwayat Transaksi</h3>
                {customerTransactions.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {customerTransactions.map((tx) => (
                      <div key={tx.id} className="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs text-[#D4AF37]">{tx.invoice_number}</span>
                          <span className="text-xs text-zinc-400">
                            {new Date(tx.created_at).toLocaleDateString('id-ID')} {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">
                            {tx.items.map(i => i.service_name).join(', ')}
                          </span>
                          <span className="font-mono font-semibold text-white">
                            Rp {tx.total.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-zinc-500 py-4">Belum ada transaksi</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={loading}
        title="Hapus Customer?"
        description={deleteTarget ? `Customer "${deleteTarget.name}" akan dihapus. Pastikan tidak ada membership aktif untuk customer ini.` : ''}
      />
    </Layout>
  );
};
