import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { Plus, Pencil } from 'lucide-react';
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
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category: '',
  });
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Gagal memuat data layanan');
    }
  };
  
  const handleAddService = async () => {
    try {
      await api.post('/services', {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
      });
      toast.success('Layanan berhasil ditambahkan');
      setShowAddDialog(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        category: '',
      });
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan layanan');
    }
  };
  
  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="services-page">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-secondary font-bold text-4xl text-white mb-2">Services</h1>
            <p className="text-zinc-400">Kelola paket layanan car wash</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            data-testid="add-service-button"
            className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Layanan
          </Button>
        </div>
        
        {/* Services by Category */}
        {Object.keys(groupedServices).map((category) => (
          <div key={category} className="mb-8">
            <h2 className="font-secondary text-2xl text-white mb-4 capitalize">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedServices[category].map((service) => (
                <div
                  key={service.id}
                  className="bg-[#121214] border border-zinc-800 rounded-sm p-6 hover:border-[#D4AF37]/30 transition-all hover-lift"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-white">{service.name}</h3>
                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">{service.category}</span>
                  </div>
                  
                  <p className="text-sm text-zinc-400 mb-4">{service.description || 'Tidak ada deskripsi'}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Harga</p>
                      <p className="font-mono text-xl font-bold text-[#D4AF37]">
                        Rp {service.price.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">Durasi</p>
                      <p className="font-mono text-sm text-white">{service.duration_minutes} menit</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {services.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Belum ada layanan
          </div>
        )}
      </div>
      
      {/* Add Service Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tambah Layanan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Nama Layanan *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="service-name-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Cuci Eksterior Medium"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Deskripsi layanan..."
                rows={3}
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Kategori *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="service-category-select">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exterior">Exterior</SelectItem>
                  <SelectItem value="interior">Interior</SelectItem>
                  <SelectItem value="detailing">Detailing</SelectItem>
                  <SelectItem value="coating">Coating</SelectItem>
                  <SelectItem value="polish">Polish</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-400 mb-2">Harga *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  data-testid="service-price-input"
                  className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-zinc-400 mb-2">Durasi (menit) *</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  data-testid="service-duration-input"
                  className="bg-zinc-900/50 border-zinc-800 text-white font-mono"
                  placeholder="30"
                />
              </div>
            </div>
            <Button
              onClick={handleAddService}
              disabled={!formData.name || !formData.category || !formData.price || !formData.duration_minutes}
              data-testid="submit-service-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              Tambah Layanan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};