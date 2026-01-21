import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Download, AlertTriangle, Package } from 'lucide-react';
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

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unit: '',
    current_stock: '',
    min_stock: '',
    max_stock: '',
    unit_cost: '',
    supplier: '',
  });
  
  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);
  
  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (error) {
      toast.error('Gagal memuat data inventory');
    }
  };
  
  const fetchLowStock = async () => {
    try {
      const response = await api.get('/inventory/low-stock');
      setLowStockItems(response.data);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };
  
  const handleAddItem = async () => {
    try {
      await api.post('/inventory', {
        ...formData,
        current_stock: parseFloat(formData.current_stock),
        min_stock: parseFloat(formData.min_stock),
        max_stock: parseFloat(formData.max_stock),
        unit_cost: parseFloat(formData.unit_cost),
      });
      toast.success('Item berhasil ditambahkan');
      setShowAddDialog(false);
      setFormData({
        sku: '',
        name: '',
        category: '',
        unit: '',
        current_stock: '',
        min_stock: '',
        max_stock: '',
        unit_cost: '',
        supplier: '',
      });
      fetchInventory();
      fetchLowStock();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan item');
    }
  };
  
  const handleExport = () => {
    const exportData = items.map(item => ({
      'SKU': item.sku,
      'Nama Produk': item.name,
      'Kategori': item.category,
      'Stok Saat Ini': item.current_stock,
      'Unit': item.unit,
      'Min Stok': item.min_stock,
      'Max Stok': item.max_stock,
      'HPP per Unit': item.unit_cost,
      'Total Nilai': item.current_stock * item.unit_cost,
      'Supplier': item.supplier || '-',
    }));
    
    const success = exportToExcel(exportData, `inventory-${new Date().toISOString().split('T')[0]}`, 'Inventory');
    if (success) {
      toast.success('Data berhasil di-export');
    } else {
      toast.error('Gagal export data');
    }
  };
  
  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);
  };
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="inventory-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-secondary font-bold text-4xl text-white mb-2">Inventory</h1>
            <p className="text-zinc-400">Kelola stok produk dengan HPP tracking</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              data-testid="export-inventory-button"
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              data-testid="add-inventory-button"
              className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Item
            </Button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-[#D4AF37]" />
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Items</p>
                <p className="font-mono text-2xl font-bold text-white">{items.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Low Stock</p>
                <p className="font-mono text-2xl font-bold text-orange-500">{lowStockItems.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm flex items-center justify-center">
                <span className="text-black font-bold text-lg">Rp</span>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Nilai Inventory</p>
                <p className="font-mono text-2xl font-bold text-[#D4AF37]">
                  {getTotalValue().toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-sm p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-500 mb-1">Peringatan Stok Menipis</h3>
                <p className="text-sm text-orange-400">
                  {lowStockItems.length} item mencapai atau di bawah minimum stock.
                  {' '}{lowStockItems.slice(0, 3).map(item => item.name).join(', ')}
                  {lowStockItems.length > 3 && ` dan ${lowStockItems.length - 3} lainnya`}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Inventory Table */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Unit</th>
                  <th>Min/Max</th>
                  <th>HPP/Unit</th>
                  <th>Total Nilai</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isLowStock = item.current_stock <= item.min_stock;
                  const totalValue = item.current_stock * item.unit_cost;
                  
                  return (
                    <tr key={item.id} className={isLowStock ? 'bg-orange-500/5' : ''}>
                      <td className="font-mono text-sm font-semibold">{item.sku}</td>
                      <td className="font-semibold text-white">{item.name}</td>
                      <td>
                        <span className="px-2 py-1 bg-zinc-800 rounded text-xs">{item.category}</span>
                      </td>
                      <td className={`font-mono font-bold ${
                        isLowStock ? 'text-orange-500' : 'text-white'
                      }`}>
                        {item.current_stock}
                      </td>
                      <td className="text-sm text-zinc-400">{item.unit}</td>
                      <td className="font-mono text-sm text-zinc-400">
                        {item.min_stock} / {item.max_stock}
                      </td>
                      <td className="font-mono text-[#D4AF37]">
                        Rp {item.unit_cost.toLocaleString('id-ID')}
                      </td>
                      <td className="font-mono font-semibold text-white">
                        Rp {totalValue.toLocaleString('id-ID')}
                      </td>
                      <td className="text-sm text-zinc-400">{item.supplier || '-'}</td>
                      <td>
                        {isLowStock ? (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-500 rounded text-xs font-semibold">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs font-semibold">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {items.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                Belum ada item di inventory
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tambah Item Inventory</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 mb-2">SKU *</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                data-testid="sku-input"
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                placeholder="CHEM-001"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Nama Produk *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="name-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Car Shampoo"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Kategori *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chemicals">Chemicals</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="equipment_parts">Equipment Parts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                  <SelectValue placeholder="Pilih unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="liter">Liter</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="pcs">Pcs</SelectItem>
                  <SelectItem value="ml">ML</SelectItem>
                  <SelectItem value="gram">Gram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Stok Saat Ini *</Label>
              <Input
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Min Stock *</Label>
              <Input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Max Stock *</Label>
              <Input
                type="number"
                value={formData.max_stock}
                onChange={(e) => setFormData({ ...formData, max_stock: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">HPP per Unit *</Label>
              <Input
                type="number"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-zinc-400 mb-2">Supplier</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Nama supplier"
              />
            </div>
          </div>
          <Button
            onClick={handleAddItem}
            disabled={!formData.sku || !formData.name || !formData.category || !formData.unit || !formData.current_stock || !formData.min_stock || !formData.max_stock || !formData.unit_cost}
            data-testid="submit-inventory-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase mt-4"
          >
            Tambah Item
          </Button>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};