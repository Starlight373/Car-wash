import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { Download, Search, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { exportToExcel } from '../utils/excelExport';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  useEffect(() => {
    filterTransactions();
  }, [searchTerm, dateFilter, transactions]);
  
  const fetchTransactions = async () => {
    try {
      const response = await api.get('/transactions');
      setTransactions(response.data);
      setFilteredTransactions(response.data);
    } catch (error) {
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };
  
  const filterTransactions = () => {
    let filtered = [...transactions];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.kasir_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(t => new Date(t.created_at) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.created_at) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(t => new Date(t.created_at) >= monthAgo);
    }
    
    setFilteredTransactions(filtered);
  };
  
  const handleViewDetail = async (transaction) => {
    try {
      const response = await api.get(`/transactions/${transaction.id}`);
      setSelectedTransaction(response.data);
      setShowDetailDialog(true);
    } catch (error) {
      toast.error('Gagal memuat detail transaksi');
    }
  };
  
  const handleExport = () => {
    const exportData = filteredTransactions.map(t => ({
      'Invoice': t.invoice_number,
      'Tanggal': new Date(t.created_at).toLocaleString('id-ID'),
      'Kasir': t.kasir_name,
      'Customer': t.customer_name || 'Walk-in',
      'Subtotal': t.subtotal,
      'Total': t.total,
      'Payment Method': t.payment_method,
      'Payment Received': t.payment_received,
      'Change': t.change_amount,
      'Notes': t.notes || '-',
    }));
    
    const success = exportToExcel(
      exportData, 
      `transactions-${new Date().toISOString().split('T')[0]}`, 
      'Transactions'
    );
    
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };
  
  const getTotalRevenue = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  };
  
  const getTotalCount = () => {
    return filteredTransactions.length;
  };
  
  const getAverageTransaction = () => {
    const total = getTotalRevenue();
    const count = getTotalCount();
    return count > 0 ? total / count : 0;
  };
  
  const getPaymentMethodBreakdown = () => {
    const breakdown = { cash: 0, card: 0, qr: 0 };
    filteredTransactions.forEach(t => {
      breakdown[t.payment_method] = (breakdown[t.payment_method] || 0) + t.total;
    });
    return breakdown;
  };
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="transactions-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-secondary font-bold text-4xl text-white mb-2">
              {currentUser.role === 'kasir' ? 'Transaksi Saya' : 'Semua Transaksi'}
            </h1>
            <p className="text-zinc-400">
              {currentUser.role === 'kasir' 
                ? 'Riwayat transaksi yang Anda proses' 
                : 'Riwayat transaksi dari semua kasir'}
            </p>
          </div>
          <Button
            onClick={handleExport}
            data-testid="export-transactions-button"
            className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Transaksi</p>
            <p className="font-mono text-3xl font-bold text-white">{getTotalCount()}</p>
          </div>
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Revenue</p>
            <p className="font-mono text-2xl font-bold text-[#D4AF37]">
              Rp {getTotalRevenue().toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rata-rata</p>
            <p className="font-mono text-2xl font-bold text-white">
              Rp {getAverageTransaction().toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Payment Breakdown</p>
            <div className="space-y-1">
              {Object.entries(getPaymentMethodBreakdown()).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-sm">
                  <span className="text-zinc-400 capitalize">{method}:</span>
                  <span className="text-white font-mono">
                    Rp {amount.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 w-5 h-5" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-transactions-input"
              className="pl-12 bg-zinc-900/50 border-zinc-800 text-white"
              placeholder="Cari invoice, customer, atau kasir..."
            />
          </div>
          <div className="flex gap-2">
            {['all', 'today', 'week', 'month'].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                data-testid={`filter-${filter}`}
                className={`px-4 py-2 rounded-sm font-medium transition-colors ${
                  dateFilter === filter 
                    ? 'bg-[#D4AF37] text-black' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {filter === 'all' ? 'Semua' : filter === 'today' ? 'Hari Ini' : filter === 'week' ? 'Minggu Ini' : 'Bulan Ini'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Transactions Table */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Tanggal & Waktu</th>
                  <th>Kasir</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="font-mono font-semibold text-[#D4AF37]">{transaction.invoice_number}</td>
                    <td className="font-mono text-sm">
                      <div>{new Date(transaction.created_at).toLocaleDateString('id-ID')}</div>
                      <div className="text-xs text-zinc-500">{new Date(transaction.created_at).toLocaleTimeString('id-ID')}</div>
                    </td>
                    <td className="text-sm">{transaction.kasir_name}</td>
                    <td className="text-sm">{transaction.customer_name || <span className="text-zinc-500">Walk-in</span>}</td>
                    <td className="text-sm">{transaction.items.length} item(s)</td>
                    <td className="font-mono font-bold text-white">Rp {transaction.total.toLocaleString('id-ID')}</td>
                    <td>
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs uppercase font-semibold">
                        {transaction.payment_method}
                      </span>
                    </td>
                    <td className="text-sm text-zinc-400 max-w-xs truncate">
                      {transaction.notes || '-'}
                    </td>
                    <td>
                      <Button
                        onClick={() => handleViewDetail(transaction)}
                        data-testid={`view-transaction-${transaction.id}`}
                        className="bg-zinc-800 text-white hover:bg-zinc-700 h-8 px-3"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                {searchTerm || dateFilter !== 'all' ? 'Tidak ada transaksi yang ditemukan' : 'Belum ada transaksi'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Transaction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Detail Transaksi</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Invoice Number</p>
                  <p className="font-mono font-bold text-white">{selectedTransaction.invoice_number}</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Tanggal & Waktu</p>
                  <p className="text-sm text-white">
                    {new Date(selectedTransaction.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Kasir</p>
                  <p className="text-sm text-white">{selectedTransaction.kasir_name}</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Customer</p>
                  <p className="text-sm text-white">{selectedTransaction.customer_name || 'Walk-in'}</p>
                </div>
              </div>
              
              {/* Items */}
              <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-3">Items</p>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{item.service_name || item.product_name}</p>
                        <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-mono text-sm text-white">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="font-mono text-white">Rp {selectedTransaction.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-zinc-800 pt-2">
                    <span className="text-white">Total</span>
                    <span className="font-mono text-[#D4AF37]">Rp {selectedTransaction.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Payment Method</span>
                    <span className="uppercase font-semibold text-white">{selectedTransaction.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Payment Received</span>
                    <span className="font-mono text-white">Rp {selectedTransaction.payment_received.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Change</span>
                    <span className="font-mono text-green-500">Rp {selectedTransaction.change_amount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              {selectedTransaction.notes && (
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-2">Catatan</p>
                  <p className="text-sm text-white">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
