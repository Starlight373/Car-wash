import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { Plus, UserCheck, UserX, Key, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { EditButton } from '../components/EditButton';
import { DeleteButton } from '../components/DeleteButton';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
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
import { Switch } from '../components/ui/switch';

export const SettingsPage = () => {
  const [users, setUsers] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: '',
    phone: '',
  });
  
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: '',
    is_active: true,
  });
  
  const [newPassword, setNewPassword] = useState('');
  
  const currentUser = getCurrentUser();
  const canManageUsers = currentUser?.role === 'owner' || currentUser?.role === 'manager';
  const isOwner = currentUser?.role === 'owner';
  
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
    if (!formData.username || !formData.password || !formData.full_name || !formData.role) {
      toast.error('Mohon lengkapi data yang diperlukan');
      return;
    }
    
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditData({
      full_name: user.full_name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
    });
    setShowEditDialog(true);
  };
  
  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/users/${editingUser.id}`, editData);
      toast.success('User berhasil diupdate');
      setShowEditDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = (user) => {
    setPasswordTarget(user);
    setNewPassword('');
    setShowPasswordDialog(true);
  };
  
  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/users/${passwordTarget.id}/reset-password`, {
        new_password: newPassword,
      });
      toast.success(`Password ${passwordTarget.full_name} berhasil direset`);
      setShowPasswordDialog(false);
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal reset password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success('User berhasil dinonaktifkan');
      fetchUsers();
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus user');
    } finally {
      setLoading(false);
    }
  };
  
  const getRoleBadge = (role) => {
    const badges = {
      owner: 'bg-[#D4AF37]/20 text-[#D4AF37]',
      manager: 'bg-blue-500/20 text-blue-500',
      kasir: 'bg-green-500/20 text-green-500',
      teknisi: 'bg-purple-500/20 text-purple-500',
    };
    
    const labels = {
      owner: 'Owner',
      manager: 'Manager',
      kasir: 'Kasir',
      teknisi: 'Teknisi',
    };
    
    return (
      <span className={`px-3 py-1 rounded-sm text-xs font-bold uppercase ${badges[role]}`}>
        {labels[role]}
      </span>
    );
  };
  
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
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#D4AF37]" />
              <h2 className="font-secondary text-2xl text-white">User Management</h2>
            </div>
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
            {users.map((user) => {
              const isCurrentUser = user.id === currentUser.id;
              const canEdit = canManageUsers && !isCurrentUser;
              const canDelete = isOwner && !isCurrentUser;
              
              return (
                <div
                  key={user.id}
                  className={`bg-zinc-900/50 border rounded-sm p-4 ${
                    isCurrentUser ? 'border-[#D4AF37]' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[#D4AF37] font-bold text-lg">
                          {user.full_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">{user.full_name}</h3>
                          {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-xs font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">@{user.username}</p>
                      </div>
                    </div>
                    {user.is_active ? (
                      <UserCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <UserX className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-xs text-zinc-500">Role</p>
                      {getRoleBadge(user.role)}
                    </div>
                    {user.email && (
                      <div>
                        <p className="text-xs text-zinc-500">Email</p>
                        <p className="text-sm text-white truncate">{user.email}</p>
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
                  
                  {(canEdit || canDelete) && (
                    <div className="flex gap-2 pt-3 border-t border-zinc-800">
                      {canEdit && (
                        <>
                          <Button
                            onClick={() => handleEdit(user)}
                            data-testid={`edit-user-${user.id}`}
                            className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 h-8 text-xs"
                          >
                            Edit Info
                          </Button>
                          <Button
                            onClick={() => handleResetPassword(user)}
                            data-testid={`reset-password-${user.id}`}
                            className="flex-1 bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 h-8 text-xs"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Reset Password
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <DeleteButton
                          onClick={() => setDeleteTarget(user)}
                          data-testid={`delete-user-${user.id}`}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
                placeholder="Minimal 6 karakter"
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
                  {isOwner && <SelectItem value="owner">Owner</SelectItem>}
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
              disabled={loading}
              data-testid="submit-user-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              {loading ? 'Menambahkan...' : 'Tambah User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                <p className="text-xs text-zinc-500">Username</p>
                <p className="text-sm font-semibold text-white">@{editingUser.username}</p>
              </div>
              
              <div>
                <Label className="text-zinc-400 mb-2">Nama Lengkap</Label>
                <Input
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  data-testid="edit-fullname-input"
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 mb-2">Email</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 mb-2">Telepon</Label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-400 mb-2">Role</Label>
                <Select
                  value={editData.role}
                  onValueChange={(value) => setEditData({ ...editData, role: value })}
                >
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                    <SelectItem value="teknisi">Teknisi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                <div>
                  <Label className="text-zinc-400">Status Aktif</Label>
                  <p className="text-xs text-zinc-500">User dapat login dan mengakses sistem</p>
                </div>
                <Switch
                  checked={editData.is_active}
                  onCheckedChange={(checked) => setEditData({ ...editData, is_active: checked })}
                  data-testid="edit-active-switch"
                />
              </div>
              <Button
                onClick={handleSaveEdit}
                disabled={loading}
                data-testid="save-edit-user-button"
                className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Reset Password</DialogTitle>
          </DialogHeader>
          {passwordTarget && (
            <div className="space-y-4">
              <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                <p className="text-sm text-zinc-400 mb-1">Reset password untuk:</p>
                <p className="text-lg font-semibold text-white">{passwordTarget.full_name}</p>
                <p className="text-sm text-zinc-500">@{passwordTarget.username}</p>
              </div>
              
              <div>
                <Label className="text-zinc-400 mb-2">Password Baru *</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  data-testid="new-password-input"
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                  placeholder="Minimal 6 karakter"
                />
                <p className="text-xs text-zinc-500 mt-1">Password akan direset dan user harus login dengan password baru</p>
              </div>
              
              <Button
                onClick={handleSavePassword}
                disabled={loading}
                data-testid="confirm-reset-password-button"
                className="w-full bg-blue-500 text-white hover:bg-blue-600 font-bold uppercase"
              >
                {loading ? 'Mereset...' : 'Reset Password'}
              </Button>
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
        title="Nonaktifkan User?"
        description={deleteTarget ? `User ${deleteTarget.full_name} akan dinonaktifkan dan tidak dapat login. User tidak akan dihapus dari sistem.` : ''}
      />
    </Layout>
  );
};
