import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { Plus, UserCheck, UserX } from 'lucide-react';
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

export const SettingsPage = () => {
  const [users, setUsers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: '',
    phone: '',
  });
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data users');
    }
  };
  
  const handleAddUser = async () => {
    try {
      await api.post('/auth/register', formData);
      toast.success('User berhasil ditambahkan');
      setShowAddDialog(false);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        role: '',
        phone: '',
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan user');
    }
  };
  
  const canManageUsers = currentUser?.role === 'owner' || currentUser?.role === 'manager';
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="settings-page">
        <div className="mb-6">
          <h1 className="font-secondary font-bold text-4xl text-white mb-2">Settings</h1>
          <p className="text-zinc-400">Kelola user dan pengaturan sistem</p>
        </div>
        
        {/* User Management */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-secondary text-2xl text-white">User Management</h2>
            {canManageUsers && (
              <Button
                onClick={() => setShowAddDialog(true)}
                data-testid="add-user-button"
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah User
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                      <span className="text-[#D4AF37] font-bold">{user.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{user.full_name}</h3>
                      <p className="text-xs text-zinc-500">@{user.username}</p>
                    </div>
                  </div>
                  {user.is_active ? (
                    <UserCheck className="w-5 h-5 text-green-500" />
                  ) : (
                    <UserX className="w-5 h-5 text-red-500" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-zinc-500">Role</p>
                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-semibold text-[#D4AF37] uppercase">
                      {user.role}
                    </span>
                  </div>
                  {user.email && (
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="text-sm text-white">{user.email}</p>
                    </div>
                  )}
                  {user.phone && (
                    <div>
                      <p className="text-xs text-zinc-500">Telepon</p>
                      <p className="text-sm text-white">{user.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-zinc-500">Bergabung</p>
                    <p className="text-sm text-white">{new Date(user.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Outlet Info */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
          <h2 className="font-secondary text-2xl text-white mb-4">Outlet Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400 mb-2">Nama Outlet</Label>
              <Input
                value="Wash & Go - Main Branch"
                disabled
                className="bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Alamat</Label>
              <Input
                value="Jl. Sudirman No. 123, Jakarta"
                disabled
                className="bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Telepon</Label>
              <Input
                value="021-12345678"
                disabled
                className="bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Email</Label>
              <Input
                value="info@washngo.com"
                disabled
                className="bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Multi-outlet support akan tersedia di update mendatang</p>
        </div>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tambah User Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="user-username-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="username"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                data-testid="user-password-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="password"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Nama Lengkap *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                data-testid="user-fullname-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Nama lengkap"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="user-role-select">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="kasir">Kasir</SelectItem>
                  <SelectItem value="teknisi">Teknisi</SelectItem>
                </SelectContent>
              </Select>
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
              <Label className="text-zinc-400 mb-2">Telepon</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <Button
              onClick={handleAddUser}
              disabled={!formData.username || !formData.password || !formData.full_name || !formData.role}
              data-testid="submit-user-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              Tambah User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};