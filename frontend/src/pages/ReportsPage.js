import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Download, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { exportToExcel, exportMultipleSheets } from '../utils/excelExport';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export const ReportsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  
  useEffect(() => {
    fetchAllData();
  }, []);
  
  const fetchAllData = async () => {
    try {
      const [transRes, custRes, memRes, invRes, shiftRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/customers'),
        api.get('/memberships'),
        api.get('/inventory'),
        api.get('/shifts'),
      ]);
      
      setTransactions(transRes.data);
      setCustomers(custRes.data);
      setMemberships(memRes.data);
      setInventory(invRes.data);
      setShifts(shiftRes.data);
    } catch (error) {
      toast.error('Gagal memuat data reports');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportSales = () => {
    const salesData = transactions.map(t => ({
      'Invoice': t.invoice_number,
      'Tanggal': new Date(t.created_at).toLocaleString('id-ID'),
      'Kasir': t.kasir_name,
      'Customer': t.customer_name || 'Walk-in',
      'Total': t.total,
      'Payment Method': t.payment_method,
      'Payment Received': t.payment_received,
      'Change': t.change_amount,
    }));
    
    const success = exportToExcel(salesData, `sales-report-${new Date().toISOString().split('T')[0]}`, 'Sales Report');
    if (success) {
      toast.success('Sales report berhasil di-export');
    } else {
      toast.error('Gagal export report');
    }
  };
  
  const handleExportInventory = () => {
    const inventoryData = inventory.map(item => ({
      'SKU': item.sku,
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Stok': item.current_stock,
      'Unit': item.unit,
      'Min Stock': item.min_stock,
      'Max Stock': item.max_stock,
      'HPP per Unit': item.unit_cost,
      'Total Nilai': item.current_stock * item.unit_cost,
      'Supplier': item.supplier || '-',
    }));
    
    const success = exportToExcel(inventoryData, `inventory-report-${new Date().toISOString().split('T')[0]}`, 'Inventory Report');
    if (success) {
      toast.success('Inventory report berhasil di-export');
    } else {
      toast.error('Gagal export report');
    }
  };
  
  const handleExportCustomers = () => {
    const customerData = customers.map(c => ({
      'Nama': c.name,
      'Telepon': c.phone,
      'Email': c.email || '-',
      'Kendaraan': c.vehicle_number || '-',
      'Total Kunjungan': c.total_visits,
      'Total Belanja': c.total_spending,
      'Bergabung': new Date(c.join_date).toLocaleDateString('id-ID'),
    }));
    
    const success = exportToExcel(customerData, `customers-report-${new Date().toISOString().split('T')[0]}`, 'Customers Report');
    if (success) {
      toast.success('Customer report berhasil di-export');
    } else {
      toast.error('Gagal export report');
    }
  };
  
  const handleExportMemberships = () => {
    const membershipData = memberships.map(m => ({
      'Customer': m.customer_name,
      'Tipe': m.membership_type,
      'Tanggal Mulai': new Date(m.start_date).toLocaleDateString('id-ID'),
      'Tanggal Berakhir': new Date(m.end_date).toLocaleDateString('id-ID'),
      'Status': m.status,
      'Usage Count': m.usage_count,
      'Harga': m.price,
    }));
    
    const success = exportToExcel(membershipData, `memberships-report-${new Date().toISOString().split('T')[0]}`, 'Memberships Report');
    if (success) {
      toast.success('Membership report berhasil di-export');
    } else {
      toast.error('Gagal export report');
    }
  };
  
  const handleExportShifts = () => {
    const shiftData = shifts.map(s => ({
      'Tanggal Buka': new Date(s.opened_at).toLocaleString('id-ID'),
      'Tanggal Tutup': s.closed_at ? new Date(s.closed_at).toLocaleString('id-ID') : '-',
      'Kasir': s.kasir_name,
      'Modal Awal': s.opening_balance,
      'Saldo Akhir': s.closing_balance || '-',
      'Expected': s.expected_balance || '-',
      'Selisih': s.variance || '-',
      'Status': s.status,
    }));
    
    const success = exportToExcel(shiftData, `shifts-report-${new Date().toISOString().split('T')[0]}`, 'Shifts Report');
    if (success) {
      toast.success('Shift report berhasil di-export');
    } else {
      toast.error('Gagal export report');
    }
  };
  
  const handleExportAll = () => {
    const sheets = [
      {
        data: transactions.map(t => ({
          'Invoice': t.invoice_number,
          'Tanggal': new Date(t.created_at).toLocaleString('id-ID'),
          'Kasir': t.kasir_name,
          'Customer': t.customer_name || 'Walk-in',
          'Total': t.total,
          'Payment': t.payment_method,
        })),
        sheetName: 'Sales',
      },
      {
        data: inventory.map(item => ({
          'SKU': item.sku,
          'Produk': item.name,
          'Stok': item.current_stock,
          'HPP': item.unit_cost,
          'Total Nilai': item.current_stock * item.unit_cost,
        })),
        sheetName: 'Inventory',
      },
      {
        data: customers.map(c => ({
          'Nama': c.name,
          'Telepon': c.phone,
          'Total Kunjungan': c.total_visits,
          'Total Belanja': c.total_spending,
        })),
        sheetName: 'Customers',
      },
      {
        data: memberships.map(m => ({
          'Customer': m.customer_name,
          'Tipe': m.membership_type,
          'Status': m.status,
          'Harga': m.price,
        })),
        sheetName: 'Memberships',
      },
    ];
    
    const success = exportMultipleSheets(sheets, `complete-report-${new Date().toISOString().split('T')[0]}`);
    if (success) {
      toast.success('Complete report berhasil di-export');
    } else {
      toast.error('Gagal export report');
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-zinc-400">Loading reports...</div>
        </div>
      </Layout>
    );
  }
  
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalTransactions = transactions.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="reports-page">
        <div className="mb-6">
          <h1 className="font-secondary font-bold text-4xl text-white mb-2">Reports & Analytics</h1>
          <p className="text-zinc-400">Export data ke Excel untuk analisis lebih lanjut</p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Revenue</p>
            <p className="font-mono text-2xl font-bold text-[#D4AF37]">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Transaksi</p>
            <p className="font-mono text-2xl font-bold text-white">{totalTransactions}</p>
          </div>
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Avg Transaction</p>
            <p className="font-mono text-2xl font-bold text-white">
              Rp {avgTransaction.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Inventory Value</p>
            <p className="font-mono text-2xl font-bold text-white">
              Rp {totalInventoryValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
        
        {/* Export Actions */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
          <h2 className="font-secondary text-2xl text-white mb-6">Export Reports</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={handleExportSales}
              data-testid="export-sales-report"
              className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 text-left hover:border-[#D4AF37]/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Download className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs text-zinc-500">{transactions.length} records</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">Sales Report</h3>
              <p className="text-sm text-zinc-400">Detail transaksi, kasir, payment method</p>
            </button>
            
            <button
              onClick={handleExportInventory}
              data-testid="export-inventory-report"
              className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 text-left hover:border-[#D4AF37]/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Download className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs text-zinc-500">{inventory.length} items</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">Inventory Report</h3>
              <p className="text-sm text-zinc-400">Stok, HPP, nilai inventory</p>
            </button>
            
            <button
              onClick={handleExportCustomers}
              data-testid="export-customers-report"
              className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 text-left hover:border-[#D4AF37]/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Download className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs text-zinc-500">{customers.length} customers</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">Customer Report</h3>
              <p className="text-sm text-zinc-400">Data customer, kunjungan, spending</p>
            </button>
            
            <button
              onClick={handleExportMemberships}
              data-testid="export-memberships-report"
              className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 text-left hover:border-[#D4AF37]/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Download className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs text-zinc-500">{memberships.length} memberships</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">Membership Report</h3>
              <p className="text-sm text-zinc-400">Status, expiry, usage data</p>
            </button>
            
            <button
              onClick={handleExportShifts}
              data-testid="export-shifts-report"
              className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 text-left hover:border-[#D4AF37]/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Download className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs text-zinc-500">{shifts.length} shifts</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">Shift Report</h3>
              <p className="text-sm text-zinc-400">Opening, closing, variance per kasir</p>
            </button>
            
            <button
              onClick={handleExportAll}
              data-testid="export-all-reports"
              className="bg-gradient-to-br from-[#D4AF37]/20 to-[#F59E0B]/20 border border-[#D4AF37] rounded-sm p-6 text-left hover:from-[#D4AF37]/30 hover:to-[#F59E0B]/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <Download className="w-6 h-6 text-[#D4AF37]" />
                <span className="text-xs text-[#D4AF37] font-semibold">ALL DATA</span>
              </div>
              <h3 className="font-semibold text-white mb-1 group-hover:text-[#D4AF37] transition-colors">Complete Report</h3>
              <p className="text-sm text-zinc-400">All reports dalam satu file Excel</p>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};