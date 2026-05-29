import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShoppingCart,
  Clock,
  IndianRupee,
  Package,
  TrendingUp,
  AlertTriangle,
  PackageX,
  Star,
  Trophy,
  LineChart,
  Store,
} from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import Table from '@/components/admin/Table';
import StatusBadge, { getStatusVariant } from '@/components/admin/StatusBadge';
import { TIME_PERIOD_LABELS, TimePeriod, ORDER_STATUS_LABELS } from '@/utils/constants';
import { formatCurrency } from '@/utils/gstCalculator';
import { useAdminData } from '@/context/AdminDataContext';
import { Order, dashboardApi, DashboardStats } from '@/services/adminApi';
import { cn } from '@/lib/utils';

type DashboardPeriod = 'all' | TimePeriod;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('all');
  const [customYear, setCustomYear] = useState<number>(new Date().getFullYear());
  const { state } = useAdminData();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    newUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalDeliveredOrders: 0,
    totalProfit: 0,
    activeProducts: 0,
  });
  const [profitInsights, setProfitInsights] = useState<{
    totalProfit: number;
    mostSoldProduct: { name: string; soldQuantity: number } | null;
    mostProfitableProduct: { name: string; totalProfit: number } | null;
    leastProfitableProduct: { name: string; totalProfit: number } | null;
    profitTrend: Array<{ date: string; totalProfit: number }>;
  }>({
    totalProfit: 0,
    mostSoldProduct: null,
    mostProfitableProduct: null,
    leastProfitableProduct: null,
    profitTrend: [],
  });
  const [topProducts, setTopProducts] = useState<Array<{ _id: string; name: string; totalQuantity: number }>>([]);
  const [roboticsSales, setRoboticsSales] = useState<{
    totalCourseRevenue: number;
    totalSessionRevenue: number;
    totalRevenue: number;
    courseEnrollmentsCount: number;
    bookedSessionsCount: number;
  }>({
    totalCourseRevenue: 0,
    totalSessionRevenue: 0,
    totalRevenue: 0,
    courseEnrollmentsCount: 0,
    bookedSessionsCount: 0,
  });
  const offline = stats.offline;
  const online = stats.online;

  const derivedStats = useMemo(
    () => ({
      activeUsers: state.users.filter((u) => u.status === 'active').length,
      blockedUsers: state.users.filter((u) => u.status === 'blocked').length,
      inStockProducts: state.products.filter((p) => p.stockStatus === 'in_stock').length,
      outOfStockProducts: state.products.filter((p) => p.stockStatus === 'out_of_stock').length,
      pendingReviews: state.reviews.filter((r) => r.status === 'pending').length,
      unreadNotifications: state.notifications.filter((n) => !n.read).length,
    }),
    [state.users, state.products, state.reviews, state.notifications]
  );

  useEffect(() => {
    const loadStats = async () => {
      const year = selectedPeriod === 'custom-year' ? customYear : undefined;
      const [statsRes, profitRes, topRes] = await Promise.all([
        dashboardApi.getStats(selectedPeriod, year),
        dashboardApi.getProfitInsights(selectedPeriod, year),
        dashboardApi.getMostDemandingProducts(5, selectedPeriod, year),
      ]);
      setStats(statsRes);
      setProfitInsights({
        totalProfit: profitRes.totalProfit || 0,
        mostSoldProduct: profitRes.mostSoldProduct || null,
        mostProfitableProduct: profitRes.mostProfitableProduct || null,
        leastProfitableProduct: profitRes.leastProfitableProduct || null,
        profitTrend: Array.isArray(profitRes.profitTrend) ? profitRes.profitTrend : [],
      });
      setTopProducts(Array.isArray(topRes) ? topRes : []);

      try {
        const robSalesRes = await dashboardApi.getRoboticsSales();
        if (robSalesRes.success && robSalesRes.data) {
          setRoboticsSales(robSalesRes.data);
        }
      } catch (err) {
        console.error('Failed to load robotics sales:', err);
      }
    };
    loadStats().catch(() => {
      setStats((prev) => prev);
    });
  }, [selectedPeriod, customYear]);

  // Recent orders - sorted by date, showing newest first
  const recentOrders = useMemo(() => {
    return [...state.orders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [state.orders]);

  // Unread notifications as activity alerts
  const recentAlerts = useMemo(() => {
    return state.notifications.filter((n) => !n.read).slice(0, 4);
  }, [state.notifications]);

  const maxProfitTrendValue = useMemo(() => {
    const maxVal = profitInsights.profitTrend.reduce(
      (acc, point) => Math.max(acc, point.totalProfit || 0),
      0
    );
    return maxVal > 0 ? maxVal : 1;
  }, [profitInsights.profitTrend]);

  const orderColumns = [
    {
      key: 'id',
      header: 'Order ID',
      render: (order: Order) => (
        <span className="font-medium text-foreground">{order.id}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
    },
    {
      key: 'itemsCount',
      header: 'Items',
      render: (order: Order) => (
        <span className="text-muted-foreground">{order.itemsCount} items</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      render: (order: Order) => (
        <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
      ),
    },
    {
      key: 'orderStatus',
      header: 'Status',
      render: (order: Order) => (
        <StatusBadge variant={getStatusVariant(order.orderStatus)}>
          {ORDER_STATUS_LABELS[order.orderStatus]}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Dashboard</h1>
          <p className="page-description">
            Welcome back. Order count, revenue, delivered, and profit totals include both online store orders and offline sales for the period you select.
          </p>
        </div>

        {/* Period Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              key="all"
              onClick={() => setSelectedPeriod('all')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedPeriod === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All dates
            </button>
            {(Object.entries(TIME_PERIOD_LABELS) as [TimePeriod, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedPeriod(key)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  selectedPeriod === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {selectedPeriod === 'custom-year' && (
            <input
              type="number"
              min="2000"
              max={new Date().getFullYear()}
              value={customYear}
              onChange={(e) => setCustomYear(Number(e.target.value) || new Date().getFullYear())}
              className="input-field w-28"
            />
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          iconColor="text-info"
          iconBgColor="bg-info/10"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Active Users"
          value={derivedStats.activeUsers.toLocaleString()}
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
          iconColor="text-success"
          iconBgColor="bg-success/10"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          trend={{ value: 15, isPositive: true }}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
          onClick={() => navigate('/orders')}
          footnote={
            offline && offline.totalOrders > 0
              ? `Includes ${offline.totalOrders.toLocaleString()} offline (see mix below)`
              : undefined
          }
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders.toLocaleString()}
          icon={Clock}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
          onClick={() => navigate('/orders')}
          footnote={
            offline && offline.pendingOrders > 0
              ? `Includes ${offline.pendingOrders.toLocaleString()} offline pending`
              : undefined
          }
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          valueClassName="text-xl leading-tight break-all"
          icon={IndianRupee}
          trend={{ value: 23, isPositive: true }}
          iconColor="text-success"
          iconBgColor="bg-success/10"
          onClick={() => navigate('/payments')}
          footnote={
            offline && offline.totalRevenue > 0
              ? `Includes ${formatCurrency(offline.totalRevenue)} offline (delivered)`
              : undefined
          }
        />
        <StatCard
          title="Active Products"
          value={derivedStats.inStockProducts.toLocaleString()}
          icon={Package}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
          onClick={() => navigate('/products')}
        />
      </div>

      {/* Same period as filters: totals above = online + offline + manual adjustments */}
      <div className="card-elevated p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-foreground">Sales mix (this period)</h2>
          <p className="text-xs text-muted-foreground">
            Online + offline columns match the API; top-row totals combine both (plus any manual adjustments).
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Online store</span>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="text-xs font-medium text-primary hover:underline"
              >
                Orders
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Orders</p>
                <p className="font-semibold text-foreground">{(online?.totalOrders ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Delivered</p>
                <p className="font-semibold text-foreground">{(online?.deliveredOrders ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Revenue</p>
                <p className="font-semibold text-foreground">{formatCurrency(online?.totalRevenue ?? 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Profit</p>
                <p className="font-semibold text-foreground">{formatCurrency(online?.totalProfit ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Offline sales</span>
              <button
                type="button"
                onClick={() => navigate('/offline-orders')}
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Orders</p>
                <p className="font-semibold text-foreground">{(offline?.totalOrders ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Delivered</p>
                <p className="font-semibold text-foreground">{(offline?.deliveredOrders ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Revenue</p>
                <p className="font-semibold text-foreground">{formatCurrency(offline?.totalRevenue ?? 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Profit</p>
                <p className="font-semibold text-foreground">{formatCurrency(offline?.totalProfit ?? 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Robotics Academy Learning Sales */}
      <div className="card-elevated p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-foreground">Robotics Academy Learning Sales</h2>
          <p className="text-xs text-muted-foreground">
            Revenue metrics from robotics courses and booked tutoring sessions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Course Purchases</span>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Enrollments</p>
                <p className="font-bold text-lg text-foreground">{roboticsSales.courseEnrollmentsCount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(roboticsSales.totalCourseRevenue)}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">Tutoring Bookings</span>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Bookings</p>
                <p className="font-bold text-lg text-foreground">{roboticsSales.bookedSessionsCount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-bold text-lg text-primary">{formatCurrency(roboticsSales.totalSessionRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <span className="text-xs font-medium text-primary uppercase tracking-wider block">Consolidated Robotics Revenue</span>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="font-bold text-lg text-foreground">{(roboticsSales.courseEnrollmentsCount + roboticsSales.bookedSessionsCount).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="font-bold text-xl text-success">{formatCurrency(roboticsSales.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Delivered Orders"
          value={stats.totalDeliveredOrders.toLocaleString()}
          icon={Package}
          iconColor="text-success"
          iconBgColor="bg-success/10"
          onClick={() => navigate('/orders')}
          footnote={
            offline && offline.deliveredOrders > 0
              ? `Includes ${offline.deliveredOrders.toLocaleString()} delivered offline`
              : undefined
          }
        />
        <StatCard
          title="Offline Orders"
          value={(stats.offline?.totalOrders ?? 0).toLocaleString()}
          icon={Store}
          iconColor="text-info"
          iconBgColor="bg-info/10"
          onClick={() => navigate('/offline-orders')}
        />
        <StatCard
          title="Online Orders"
          value={(stats.online?.totalOrders ?? 0).toLocaleString()}
          icon={ShoppingCart}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats.totalProfit)}
          icon={TrendingUp}
          iconColor="text-success"
          iconBgColor="bg-success/10"
          onClick={() => navigate('/profit')}
          footnote={
            offline && offline.totalProfit > 0
              ? `Includes ${formatCurrency(offline.totalProfit)} offline (delivered)`
              : undefined
          }
        />
        <StatCard
          title="Out of Stock"
          value={derivedStats.outOfStockProducts.toLocaleString()}
          icon={PackageX}
          iconColor="text-destructive"
          iconBgColor="bg-destructive/10"
          onClick={() => navigate('/products')}
        />
        <StatCard
          title="Pending Reviews"
          value={derivedStats.pendingReviews.toLocaleString()}
          icon={Star}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
          onClick={() => navigate('/reviews')}
        />
        <StatCard
          title="Blocked Users"
          value={derivedStats.blockedUsers.toLocaleString()}
          icon={Users}
          iconColor="text-destructive"
          iconBgColor="bg-destructive/10"
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Unread Alerts"
          value={derivedStats.unreadNotifications.toLocaleString()}
          icon={AlertTriangle}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
          onClick={() => navigate('/notifications')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card-elevated p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
              <button 
                onClick={() => navigate('/orders')}
                className="text-sm text-primary font-medium hover:underline"
              >
                View All
              </button>
            </div>
            <Table
              columns={orderColumns}
              data={recentOrders}
              keyExtractor={(order) => order.id}
              emptyMessage="No orders yet"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Most Demanding Products */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Top Products</h2>
            </div>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.totalQuantity} units sold
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No product data yet
                </p>
              )}
            </div>
          </div>

          {/* Activity Alerts */}
          <div className="card-elevated p-6">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold text-foreground">Activity Alerts</h2>
            </div>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => navigate('/notifications')}
                  >
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No new alerts
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profit Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Profit Insights */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-foreground">Profit Insights</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Most Profitable</span>
              <span className="font-medium">
                {profitInsights.mostProfitableProduct?.name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Most Sold</span>
              <span className="font-medium">
                {profitInsights.mostSoldProduct?.name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Least Profitable</span>
              <span className="font-medium">
                {profitInsights.leastProfitableProduct?.name || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Profit</span>
              <span className="font-semibold text-success">
                {formatCurrency(profitInsights.totalProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="card-elevated p-6">
          <div className="flex items-center gap-2 mb-6">
            <LineChart className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Profit Trend</h2>
          </div>
          <div className="space-y-3 max-h-80 overflow-auto pr-1">
            {profitInsights.profitTrend.length > 0 ? (
              profitInsights.profitTrend.map((point) => {
                const widthPercent = Math.max(
                  8,
                  Math.round((Math.max(0, point.totalProfit) / maxProfitTrendValue) * 100)
                );
                return (
                  <div key={point.date} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{point.date}</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(point.totalProfit)}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No profit data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
