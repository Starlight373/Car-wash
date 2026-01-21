import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { Plus, Trash2, CreditCard, Wallet, QrCode } from 'lucide-react';
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

export const POSPage = () => {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [notes, setNotes] = useState('');
  const user = getCurrentUser();
  
  useEffect(() => {
    fetchServices();
    fetchCustomers();
    checkCurrentShift();
  }, []);
  
  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Gagal memuat layanan');
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
  
  const checkCurrentShift = async () => {
    try {
      const response = await api.get(`/shifts/current/${user.id}`);
      setCurrentShift(response.data);
    } catch (error) {
      console.error('Error checking shift:', error);
    }
  };
  
  const addToCart = (service) => {
    const existingItem = cart.find(item => item.id === service.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === service.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...service, quantity: 1 }]);
    }
    toast.success(`${service.name} ditambahkan ke keranjang`);
  };
  
  const removeFromCart = (serviceId) => {
    setCart(cart.filter(item => item.id !== serviceId));
  };
  
  const updateQuantity = (serviceId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item => 
      item.id === serviceId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const handleCheckout = async () => {
    if (!currentShift) {
      toast.error('Silakan buka shift terlebih dahulu');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    
    const total = calculateTotal();
    const received = parseFloat(paymentReceived) || 0;
    
    if (received < total) {
      toast.error('Pembayaran kurang dari total');
      return;
    }
    
    try {
      const transactionData = {
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
          service_id: item.id,
          service_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
        payment_received: received,
        notes: notes || null,
      };
      
      const response = await api.post('/transactions', transactionData);
      toast.success(`Transaksi berhasil! Invoice: ${response.data.invoice_number}`);
      
      // Reset
      setCart([]);
      setSelectedCustomer(null);
      setPaymentReceived('');
      setNotes('');
      setShowCheckout(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaksi gagal');
    }
  };
  
  if (!currentShift) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-zinc-400 text-lg mb-4">Shift belum dibuka</p>
            <Button onClick={() => window.location.href = '/shift'} className="bg-[#D4AF37] text-black hover:bg-[#B5952F]">
              Buka Shift
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  const total = calculateTotal();
  const received = parseFloat(paymentReceived) || 0;
  const change = received - total;
  
  return (
    <Layout>
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]" data-testid="pos-page">
        {/* Left: Services */}
        <div className="col-span-7 overflow-y-auto custom-scrollbar">
          <h1 className="font-secondary font-bold text-3xl text-white mb-6">Point of Sale</h1>
          
          <div className="grid grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => addToCart(service)}
                data-testid={`service-${service.id}`}
                className="bg-[#121214] border border-zinc-800 rounded-sm p-4 text-left hover:border-[#D4AF37]/50 transition-all hover-lift"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{service.name}</h3>
                  <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">{service.category}</span>
                </div>
                <p className="text-sm text-zinc-400 mb-3">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-lg text-[#D4AF37]">Rp {service.price.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-zinc-500">{service.duration_minutes} menit</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Right: Cart */}
        <div className="col-span-5 bg-[#121214] border border-zinc-800 rounded-sm p-6 flex flex-col">
          <h2 className="font-secondary text-2xl text-white mb-4">Keranjang</h2>
          
          {/* Customer Selection */}
          <div className="mb-4">
            <Label className="text-zinc-400 text-sm mb-2">Customer (Opsional)</Label>
            <Select
              value={selectedCustomer?.id || ''}
              onValueChange={(value) => {
                const customer = customers.find(c => c.id === value);
                setSelectedCustomer(customer);
              }}
            >
              <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white">
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
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">Keranjang kosong</div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="bg-zinc-900/50 p-3 rounded-sm border border-zinc-800">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white text-sm">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-zinc-800 rounded text-white text-sm hover:bg-zinc-700"
                        >
                          -
                        </button>
                        <span className="font-mono text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-zinc-800 rounded text-white text-sm hover:bg-zinc-700"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-[#D4AF37] font-semibold">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Total */}
          <div className="border-t border-zinc-800 pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">Subtotal</span>
              <span className="font-mono text-white">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total</span>
              <span className="font-mono text-2xl font-bold text-[#D4AF37]">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
          
          {/* Checkout Button */}
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            data-testid="checkout-button"
            className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase py-6 text-lg"
          >
            Checkout
          </Button>
        </div>
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl">Pembayaran</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  data-testid="payment-cash"
                  className={`p-4 rounded-sm border flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'cash' 
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                      : 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700'
                  }`}
                >
                  <Wallet className="w-6 h-6" />
                  <span className="text-sm font-semibold">Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  data-testid="payment-card"
                  className={`p-4 rounded-sm border flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'card' 
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                      : 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-sm font-semibold">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('qr')}
                  data-testid="payment-qr"
                  className={`p-4 rounded-sm border flex flex-col items-center gap-2 transition-colors ${
                    paymentMethod === 'qr' 
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                      : 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700'
                  }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="text-sm font-semibold">QR</span>
                </button>
              </div>
            </div>
            
            <div>
              <Label className="text-zinc-400 mb-2">Total Pembayaran</Label>
              <div className="font-mono text-3xl font-bold text-[#D4AF37] mb-4">
                Rp {total.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div>
              <Label className="text-zinc-400 mb-2">Uang Diterima</Label>
              <Input
                type="number"
                value={paymentReceived}
                onChange={(e) => setPaymentReceived(e.target.value)}
                data-testid="payment-received-input"
                className="bg-zinc-900/50 border-zinc-800 text-white text-lg font-mono"
                placeholder="0"
              />
            </div>
            
            {received >= total && (
              <div className="bg-zinc-900/50 p-4 rounded-sm border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Kembalian</span>
                  <span className="font-mono text-2xl font-bold text-green-500">
                    Rp {change.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleCheckout}
              disabled={received < total}
              data-testid="confirm-payment-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase py-6"
            >
              Konfirmasi Pembayaran
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};