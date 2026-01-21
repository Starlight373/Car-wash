import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  CreditCard, 
  Package, 
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  Sparkles,
  Receipt
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();
  const user = getCurrentUser();
  
  const isActive = (path) => location.pathname === path;
  
  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pos', icon: ShoppingCart, label: 'POS' },
    { path: '/shift', icon: Clock, label: 'Shift Management' },
    { path: '/transactions', icon: Receipt, label: user?.role === 'kasir' ? 'Transaksi Saya' : 'Transaksi' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/memberships', icon: CreditCard, label: 'Memberships' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/services', icon: ClipboardList, label: 'Services' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  return (
    <div className="w-64 bg-[#121214] border-r border-zinc-800 h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#F59E0B] rounded-sm flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="font-secondary font-bold text-xl text-[#D4AF37]">Wash & Go</h1>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">POS System</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`sidebar-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`
                flex items-center gap-3 px-6 py-3 mx-3 rounded-sm mb-1
                font-primary transition-all duration-200
                ${active 
                  ? 'bg-[#D4AF37] text-black font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User Info */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-[#D4AF37] font-bold">{user?.full_name?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{user?.full_name || 'User'}</p>
            <p className="text-xs text-zinc-500 uppercase">{user?.role || 'kasir'}</p>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="logout-button"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};