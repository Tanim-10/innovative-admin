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
  ChevronDown,
  ChevronRight,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ADMIN_LOGO } from '@/constants/media';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarSection {
  title: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'General',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Users', path: '/users', icon: Users },
      { name: 'Gallery', path: '/gallery', icon: Image },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Settings', path: '/settings', icon: Settings },
    ]
  },
  {
    title: 'E-Shop',
    icon: ShoppingCart,
    items: [
      { name: 'Products', path: '/products', icon: Package },
      { name: 'Orders', path: '/orders', icon: ShoppingCart },
      { name: 'Offline Orders', path: '/offline-orders', icon: ReceiptIndianRupee },
      { name: 'Payments', path: '/payments', icon: CreditCard },
      { name: 'Coupons', path: '/coupons', icon: TicketPercent },
      { name: 'Delivery', path: '/delivery', icon: Truck },
      { name: 'Reviews', path: '/reviews', icon: Star },
      { name: 'Profit', path: '/profit', icon: TrendingUp },
    ]
  },
  {
    title: 'Academy',
    icon: GraduationCap,
    items: [
      { name: 'Tutors & Academy', path: '/tutors', icon: GraduationCap },
      { name: 'Workshops', path: '/workshops', icon: Calendar },
    ]
  },
  {
    title: 'Careers',
    icon: Briefcase,
    items: [
      { name: 'Internship Apps', path: '/internships', icon: Briefcase },
    ]
  }
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
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    General: true,
    'E-Shop': true,
    Academy: true,
    Careers: true,
  });

  // Auto-expand the active section if location changes and it is closed
  React.useEffect(() => {
    const activeSection = sidebarSections.find(section => 
      section.items.some(item => location.pathname === item.path)
    );
    if (activeSection) {
      setOpenSections(prev => ({
        ...prev,
        [activeSection.title]: true
      }));
    }
  }, [location.pathname]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

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
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-4">
          {sidebarSections.map((section) => {
            const isOpen = openSections[section.title] !== false;
            const SectionIcon = section.icon;
            const isSectionActive = section.items.some(item => location.pathname === item.path);

            if (isCollapsed && !isMobileOpen) {
              return (
                <div key={section.title} className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 mb-2',
                          isSectionActive 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                        title={section.title}
                      >
                        <SectionIcon className="w-5 h-5 shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      side="right" 
                      align="start" 
                      className="w-48 bg-sidebar border-sidebar-border text-sidebar-foreground ml-2 p-1.5 shadow-xl"
                    >
                      <DropdownMenuLabel className="px-2.5 py-1.5 text-xs text-sidebar-muted uppercase tracking-widest font-semibold">
                        {section.title}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-sidebar-border/50 my-1" />
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const ItemIcon = item.icon;
                        return (
                          <DropdownMenuItem 
                            key={item.path} 
                            asChild 
                            className={cn(
                              "focus:bg-sidebar-accent focus:text-sidebar-foreground cursor-pointer rounded-md my-0.5",
                              isActive && "bg-sidebar-accent/50"
                            )}
                          >
                            <NavLink
                              to={item.path}
                              onClick={handleNavClick}
                              className={cn(
                                'flex items-center gap-2.5 w-full px-2 py-1.5 text-sm rounded-md transition-colors',
                                isActive ? 'text-primary font-medium' : 'text-sidebar-foreground/80'
                              )}
                            >
                              <ItemIcon className="w-4 h-4 shrink-0" />
                              <span>{item.name}</span>
                            </NavLink>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            }

            return (
              <div key={section.title} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left',
                    isSectionActive 
                      ? 'text-sidebar-foreground bg-sidebar-accent/20 font-medium' 
                      : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon className={cn('w-5 h-5 shrink-0', isSectionActive ? 'text-primary' : 'text-sidebar-foreground/60')} />
                    <span>{section.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 opacity-60 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 opacity-60 transition-transform duration-200" />
                  )}
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                >
                  <ul className="pl-4 ml-[21px] space-y-1 border-l border-sidebar-border/30 my-1">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const ItemIcon = item.icon;

                      return (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            onClick={handleNavClick}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                              isActive 
                                ? 'bg-sidebar-accent text-sidebar-foreground font-medium' 
                                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/20'
                            )}
                          >
                            <ItemIcon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                            <span>{item.name}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
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

