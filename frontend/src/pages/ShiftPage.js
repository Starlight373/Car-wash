import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { DoorOpen, DoorClosed, TrendingUp, AlertCircle } from 'lucide-react';
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

export const ShiftPage = () => {
  const [currentShift, setCurrentShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  
  useEffect(() => {
    fetchCurrentShift();
    fetchShifts();
  }, []);
  
  const fetchCurrentShift = async () => {
    try {
      const response = await api.get(`/shifts/current/${user.id}`);
      setCurrentShift(response.data);
    } catch (error) {
      console.error('Error fetching current shift:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchShifts = async () => {
    try {
      const response = await api.get('/shifts');
      setShifts(response.data);
    } catch (error) {
      toast.error('Gagal memuat riwayat shift');
    }
  };
  
  const handleOpenShift = async () => {
    try {
      const response = await api.post('/shifts/open', {
        kasir_id: user.id,
        opening_balance: parseFloat(openingBalance),
      });
      setCurrentShift(response.data);
      setShowOpenDialog(false);
      setOpeningBalance('');
      toast.success('Shift berhasil dibuka');
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal membuka shift');
    }
  };
  
  const handleCloseShift = async () => {
    try {
      const response = await api.post('/shifts/close', {
        shift_id: currentShift.id,
        closing_balance: parseFloat(closingBalance),
        notes: closeNotes,
      });
      
      const variance = response.data.variance;
      if (variance !== 0) {
        toast.warning(`Shift ditutup. Selisih: Rp ${Math.abs(variance).toLocaleString('id-ID')} (${variance > 0 ? 'Lebih' : 'Kurang'})`);
      } else {
        toast.success('Shift ditutup. Saldo pas!');
      }
      
      setCurrentShift(null);
      setShowCloseDialog(false);
      setClosingBalance('');
      setCloseNotes('');
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menutup shift');
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
  
  return (
    <Layout>
      <div className="animate-fade-in" data-testid="shift-page">
        <h1 className="font-secondary font-bold text-4xl text-white mb-6">Shift Management</h1>
        
        {/* Current Shift Status */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6 mb-6">
          {currentShift ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
                    <DoorOpen className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h2 className="font-secondary text-2xl text-white">Shift Aktif</h2>
                    <p className="text-zinc-400 text-sm">Dibuka: {new Date(currentShift.opened_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCloseDialog(true)}
                  data-testid="close-shift-button"
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  <DoorClosed className="w-4 h-4 mr-2" />
                  Tutup Shift
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Modal Awal</p>
                  <p className="font-mono text-2xl font-bold text-white">Rp {currentShift.opening_balance.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Kasir</p>
                  <p className="font-semibold text-white">{currentShift.kasir_name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-zinc-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                <DoorClosed className="w-8 h-8 text-zinc-600" />
              </div>
              <h2 className="font-secondary text-2xl text-white mb-2">Tidak Ada Shift Aktif</h2>
              <p className="text-zinc-400 mb-6">Silakan buka shift terlebih dahulu untuk mulai transaksi</p>
              <Button
                onClick={() => setShowOpenDialog(true)}
                data-testid="open-shift-button"
                className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
              >
                <DoorOpen className="w-4 h-4 mr-2" />
                Buka Shift
              </Button>
            </div>
          )}
        </div>
        
        {/* Shift History */}
        <div className="bg-[#121214] border border-zinc-800 rounded-sm p-6">
          <h2 className="font-secondary text-2xl text-white mb-4">Riwayat Shift</h2>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Tanggal Buka</th>
                  <th>Tanggal Tutup</th>
                  <th>Kasir</th>
                  <th>Modal Awal</th>
                  <th>Saldo Akhir</th>
                  <th>Saldo Expected</th>
                  <th>Selisih</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="font-mono text-sm">{new Date(shift.opened_at).toLocaleString('id-ID')}</td>
                    <td className="font-mono text-sm">
                      {shift.closed_at ? new Date(shift.closed_at).toLocaleString('id-ID') : '-'}
                    </td>
                    <td>{shift.kasir_name}</td>
                    <td className="font-mono">Rp {shift.opening_balance.toLocaleString('id-ID')}</td>
                    <td className="font-mono">
                      {shift.closing_balance ? `Rp ${shift.closing_balance.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="font-mono">
                      {shift.expected_balance ? `Rp ${shift.expected_balance.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className={`font-mono font-semibold ${
                      shift.variance === 0 ? 'text-green-500' : 
                      shift.variance > 0 ? 'text-blue-500' : 'text-red-500'
                    }`}>
                      {shift.variance !== null && shift.variance !== undefined ? (
                        shift.variance === 0 ? 'Pas' : `${shift.variance > 0 ? '+' : ''}Rp ${shift.variance.toLocaleString('id-ID')}`
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        shift.status === 'open' 
                          ? 'bg-green-500/20 text-green-500' 
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {shift.status === 'open' ? 'Aktif' : 'Ditutup'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Open Shift Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Buka Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Kasir</Label>
              <Input
                value={user.full_name}
                disabled
                className="bg-zinc-900/50 border-zinc-800 text-white"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Modal Awal (Cash on Hand)</Label>
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                data-testid="opening-balance-input"
                className="bg-zinc-900/50 border-zinc-800 text-white text-lg font-mono"
                placeholder="0"
              />
            </div>
            <Button
              onClick={handleOpenShift}
              disabled={!openingBalance}
              data-testid="confirm-open-shift"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase"
            >
              Buka Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Close Shift Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Tutup Shift</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
              <p className="text-zinc-400 text-sm mb-1">Modal Awal</p>
              <p className="font-mono text-xl font-bold text-white">
                Rp {currentShift?.opening_balance.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Saldo Akhir (Hitung Fisik Cash)</Label>
              <Input
                type="number"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                data-testid="closing-balance-input"
                className="bg-zinc-900/50 border-zinc-800 text-white text-lg font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-zinc-400 mb-2">Catatan (Opsional)</Label>
              <Textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Catatan penutupan shift..."
                rows={3}
              />
            </div>
            <Button
              onClick={handleCloseShift}
              disabled={!closingBalance}
              data-testid="confirm-close-shift"
              className="w-full bg-red-500 text-white hover:bg-red-600 font-bold uppercase"
            >
              Tutup Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};