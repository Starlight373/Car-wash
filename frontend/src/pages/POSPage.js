import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../utils/api';
import { getCurrentUser } from '../utils/auth';
import { Trash2, CreditCard, Wallet, QrCode, User, Search, ShoppingBag, Wrench, Crown, X } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

export const POSPage = () => {
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMemberCheck, setShowMemberCheck] = useState(false);
  const [notes, setNotes] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [membershipInfo, setMembershipInfo] = useState(null);
  const [isMemberTransaction, setIsMemberTransaction] = useState(false);
  const [selectedServiceForMember, setSelectedServiceForMember] = useState(null);
  const [activeTab, setActiveTab] = useState('services');
  const user = getCurrentUser();
  
  useEffect(() => {
    fetchServices();
    fetchProducts();
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
  
  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
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
  
  const addToCart = (item, type = 'service') => {
    const itemId = `${type}-${item.id}`;
    const existingItem = cart.find(i => i.itemId === itemId);
    if (existingItem) {
      setCart(cart.map(i => 
        i.itemId === itemId 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        itemId, 
        type, 
        quantity: 1,
        originalPrice: item.price 
      }]);
    }
    toast.success(`${item.name} ditambahkan ke keranjang`);
  };
  
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.itemId !== itemId));
  };
  
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(cart.map(item => 
      item.itemId === itemId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };
  
  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  // Check membership by phone
  const handleCheckMembership = async () => {
    if (!memberPhone) {
      toast.error('Masukkan nomor telepon');
      return;
    }
    
    try {
      const response = await api.post(`/public/check-membership?phone=${memberPhone}`);
      const data = response.data;
      
      if (data.memberships && data.memberships.length > 0) {
        // Find active "All You Can Wash" membership
        const activeMembership = data.memberships.find(m => 
          m.status === 'active' && m.membership_type !== 'regular'
        );
        
        if (activeMembership) {
          setMembershipInfo({
            customer: data.customer,
            membership: activeMembership
          });
          setSelectedCustomer(data.customer);
          toast.success(`Member ditemukan: ${data.customer.name}`);
        } else {
          toast.error('Tidak ada membership All You Can Wash yang aktif');
          setMembershipInfo(null);
        }
      } else {
        toast.error('Customer tidak memiliki membership');
        setMembershipInfo(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Nomor telepon tidak terdaftar');
      setMembershipInfo(null);
    }
  };
  
  // Use membership for free wash
  const handleUseMembership = async () => {
    if (!membershipInfo || !selectedServiceForMember) {
      toast.error('Pilih layanan yang akan digunakan');
      return;
    }
    
    try {
      const response = await api.post('/memberships/use', {
        phone: memberPhone,
        service_id: selectedServiceForMember.id
      });
      
      toast.success(response.data.message);
      
      // Add to cart with price 0 and membership note
      const itemId = `service-member-${selectedServiceForMember.id}`;
      setCart([...cart, {
        ...selectedServiceForMember,
        itemId,
        type: 'member_usage',
        quantity: 1,
        price: 0,
        originalPrice: selectedServiceForMember.price,
        notes: `Member Subscription (${membershipInfo.membership.membership_type}) - ${membershipInfo.customer.name}`
      }]);
      
      setIsMemberTransaction(true);
      setShowMemberCheck(false);
      setMemberPhone('');
      setMembershipInfo(null);
      setSelectedServiceForMember(null);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menggunakan membership');
    }
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
    
    // For member transactions with 0 total, allow checkout
    if (total > 0 && received < total) {
      toast.error('Pembayaran kurang dari total');
      return;
    }
    
    try {
      const transactionData = {
        customer_id: selectedCustomer?.id || null,
        items: cart.map(item => ({
          service_id: item.type === 'service' || item.type === 'member_usage' ? item.id : null,
          product_id: item.type === 'product' ? item.id : null,
          service_name: item.name,
          price: item.price,
          quantity: item.quantity,
          is_member_usage: item.type === 'member_usage',
          notes: item.notes || null,
        })),
        payment_method: total === 0 && isMemberTransaction ? 'subscription' : paymentMethod,
        payment_received: total === 0 ? 0 : received,
        notes: isMemberTransaction 
          ? `${notes ? notes + ' | ' : ''}Member Subscription - Gratis Cuci` 
          : notes || null,
      };
      
      const response = await api.post('/transactions', transactionData);
      toast.success(`Transaksi berhasil! Invoice: ${response.data.invoice_number}`);
      
      // Reset
      setCart([]);
      setSelectedCustomer(null);
      setPaymentReceived('');
      setNotes('');
      setShowCheckout(false);
      setIsMemberTransaction(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaksi gagal');
    }
  };
  
  const clearMemberMode = () => {
    setIsMemberTransaction(false);
    setMembershipInfo(null);
    // Remove member usage items from cart
    setCart(cart.filter(item => item.type !== 'member_usage'));
  };
  
  if (!currentShift) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96" data-testid="pos-no-shift">
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
        {/* Left: Services & Products */}
        <div className="col-span-7 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-secondary font-bold text-3xl text-white">Point of Sale</h1>
            <Button
              onClick={() => setShowMemberCheck(true)}
              data-testid="check-member-button"
              className="bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black hover:opacity-90"
            >
              <Crown className="w-4 h-4 mr-2" />
              Cek Member
            </Button>
          </div>
          
          {/* Member Mode Banner */}
          {isMemberTransaction && (
            <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F59E0B]/20 border border-[#D4AF37]/50 rounded-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-[#D4AF37]" />
                  <div>
                    <p className="text-[#D4AF37] font-semibold">Mode Member Aktif</p>
                    <p className="text-sm text-zinc-400">
                      Customer: {selectedCustomer?.name} | Layanan gratis dari membership
                    </p>
                  </div>
                </div>
                <Button
                  onClick={clearMemberMode}
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 mb-4">
              <TabsTrigger 
                value="services" 
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
                data-testid="tab-services"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Layanan
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black"
                data-testid="tab-products"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Produk
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="services">
              <div className="grid grid-cols-2 gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addToCart(service, 'service')}
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
              {services.length === 0 && (
                <div className="text-center py-12 text-zinc-500">Tidak ada layanan</div>
              )}
            </TabsContent>
            
            <TabsContent value="products">
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product, 'product')}
                    data-testid={`product-${product.id}`}
                    className="bg-[#121214] border border-zinc-800 rounded-sm p-4 text-left hover:border-[#D4AF37]/50 transition-all hover-lift"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{product.name}</h3>
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">{product.category}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-3">{product.description || 'Produk fisik'}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg text-[#D4AF37]">Rp {product.price.toLocaleString('id-ID')}</span>
                    </div>
                  </button>
                ))}
              </div>
              {products.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                  <p>Tidak ada produk</p>
                  <p className="text-sm mt-2">Tambahkan produk di menu Inventory</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
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
              <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="select-customer">
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
                  <div key={item.itemId} className={`p-3 rounded-sm border ${
                    item.type === 'member_usage' 
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]/30' 
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{item.name}</h4>
                        {item.type === 'member_usage' && (
                          <p className="text-xs text-[#D4AF37]">✨ Member Subscription</p>
                        )}
                        {item.type === 'product' && (
                          <p className="text-xs text-blue-400">📦 Produk</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.itemId)}
                        className="text-red-500 hover:text-red-400"
                        data-testid={`remove-${item.itemId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          className="w-6 h-6 bg-zinc-800 rounded text-white text-sm hover:bg-zinc-700"
                          disabled={item.type === 'member_usage'}
                        >
                          -
                        </button>
                        <span className="font-mono text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          className="w-6 h-6 bg-zinc-800 rounded text-white text-sm hover:bg-zinc-700"
                          disabled={item.type === 'member_usage'}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        {item.type === 'member_usage' ? (
                          <div>
                            <span className="font-mono text-sm text-zinc-500 line-through">
                              Rp {item.originalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="font-mono text-[#D4AF37] font-semibold ml-2">
                              Rp 0
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-[#D4AF37] font-semibold">
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
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
            {isMemberTransaction && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#D4AF37]">Member Discount</span>
                <span className="font-mono text-[#D4AF37]">Applied</span>
              </div>
            )}
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
      
      {/* Member Check Dialog */}
      <Dialog open={showMemberCheck} onOpenChange={setShowMemberCheck}>
        <DialogContent className="bg-[#121214] border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-secondary text-2xl flex items-center gap-2">
              <Crown className="w-6 h-6 text-[#D4AF37]" />
              Cek Membership
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-zinc-400 mb-2">Nomor Telepon Member</Label>
              <div className="flex gap-2">
                <Input
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  data-testid="member-phone-input"
                  className="bg-zinc-900/50 border-zinc-800 text-white"
                  placeholder="08xxxxxxxxxx"
                />
                <Button
                  onClick={handleCheckMembership}
                  data-testid="search-member-button"
                  className="bg-[#D4AF37] text-black hover:bg-[#B5952F]"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Membership Info */}
            {membershipInfo && (
              <div className="bg-gradient-to-r from-[#D4AF37]/20 to-[#F59E0B]/20 border border-[#D4AF37]/50 rounded-sm p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{membershipInfo.customer.name}</h3>
                    <p className="text-sm text-zinc-400">{membershipInfo.customer.phone}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tipe Membership</span>
                    <span className="text-[#D4AF37] font-semibold capitalize">{membershipInfo.membership.membership_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Sisa Waktu</span>
                    <span className="text-green-500 font-semibold">{membershipInfo.membership.days_remaining} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Usage Bulan Ini</span>
                    <span className="text-white">{membershipInfo.membership.usage_count} kali</span>
                  </div>
                </div>
                
                {/* Select Service for Free Wash */}
                <div className="mt-4 pt-4 border-t border-[#D4AF37]/30">
                  <Label className="text-zinc-400 mb-2">Pilih Layanan (Gratis)</Label>
                  <Select
                    value={selectedServiceForMember?.id || ''}
                    onValueChange={(value) => {
                      const service = services.find(s => s.id === value);
                      setSelectedServiceForMember(service);
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800 text-white" data-testid="select-service-member">
                      <SelectValue placeholder="Pilih layanan cuci" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter(s => s.category === 'exterior' || s.category === 'interior').map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - Rp {service.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleUseMembership}
                    disabled={!selectedServiceForMember}
                    data-testid="use-membership-button"
                    className="w-full mt-3 bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black hover:opacity-90 font-bold"
                  >
                    Gunakan Membership (Gratis)
                  </Button>
                </div>
              </div>
            )}
            
            {!membershipInfo && memberPhone && (
              <p className="text-center text-zinc-500 text-sm">
                Masukkan nomor telepon dan klik cari untuk mengecek membership
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
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
              {isMemberTransaction && total === 0 && (
                <p className="text-sm text-green-500 mb-2">✨ Gratis dengan Member Subscription</p>
              )}
            </div>
            
            {total > 0 && (
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
            )}
            
            <div>
              <Label className="text-zinc-400 mb-2">Catatan (Opsional)</Label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="transaction-notes-input"
                className="bg-zinc-900/50 border-zinc-800 text-white"
                placeholder="Catatan transaksi..."
              />
            </div>
            
            {total > 0 && received >= total && (
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
              disabled={total > 0 && received < total}
              data-testid="confirm-payment-button"
              className="w-full bg-[#D4AF37] text-black hover:bg-[#B5952F] font-bold uppercase py-6"
            >
              {total === 0 ? 'Konfirmasi Transaksi Gratis' : 'Konfirmasi Pembayaran'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
