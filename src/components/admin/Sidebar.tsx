import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Star,
  Bell,
  Settings,
  X,
  TrendingUp,
  Truck,
  ReceiptIndianRupee,
  TicketPercent,
  GraduationCap,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_LOGO } from '@/constants/media';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Orders', path: '/orders', icon: ShoppingCart },
  { name: 'Offline Orders', path: '/offline-orders', icon: ReceiptIndianRupee },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Coupons', path: '/coupons', icon: TicketPercent },
  { name: 'Delivery Management', path: '/delivery', icon: Truck },
  { name: 'Reviews', path: '/reviews', icon: Star },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Profit', path: '/profit', icon: TrendingUp },
  { name: 'Tutors & Academy', path: '/tutors', icon: GraduationCap },
  { name: 'Workshops', path: '/workshops', icon: Calendar },
  { name: 'Internship Apps', path: '/internships', icon: Briefcase },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  isCollapsed?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  isMobileOpen = false,
  onCloseMobile 
}) => {
  const location = useLocation();

  const handleNavClick = () => {
    // Close mobile sidebar on navigation
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-[100dvh] max-h-screen w-64 max-w-[min(100vw,16rem)] bg-sidebar transition-all duration-300 ease-in-out flex flex-col touch-manipulation',
          // Desktop styles
          'hidden md:flex',
          isCollapsed ? 'md:w-16' : 'md:w-64',
          // Mobile styles - slide in from left
          isMobileOpen && 'flex md:hidden'
        )}
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/10 overflow-hidden shrink-0">
              <img src={ADMIN_LOGO} alt="" className="max-h-full max-w-full w-auto object-contain" width={455} height={538} />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-foreground">Innovative Hub</span>
                <span className="text-xs text-sidebar-muted">Admin Panel</span>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-2 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      'sidebar-item',
                      isActive && 'sidebar-item-active',
                      isCollapsed && !isMobileOpen && 'justify-center px-2'
                    )}
                    title={isCollapsed && !isMobileOpen ? item.name : undefined}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
                    {(!isCollapsed || isMobileOpen) && <span>{item.name}</span>}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-4 py-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-muted text-center">
              © 2025 Innovative Hub. All rights reserved.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
