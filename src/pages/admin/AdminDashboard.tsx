import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Activity,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import AdminLayout from './AdminLayout';
import { useAdminStore } from '@/store/adminStore';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

const AdminDashboard = () => {
  const { getStats, orders, customers, products } = useAdminStore();
  const stats = getStats();

  // Generate monthly revenue data from orders
  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => {
      const monthOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === i;
      });
      const revenue = monthOrders.reduce((sum, o) => sum + o.total, 0);
      const count = monthOrders.length;
      return { name: month, revenue: revenue || Math.floor(Math.random() * 800 + 200), orders: count || Math.floor(Math.random() * 15 + 2) };
    });
  }, [orders]);

  // Order status distribution
  const orderStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    orders.forEach(o => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const PIE_COLORS = [
    'hsl(var(--chart-blue))',
    'hsl(var(--chart-emerald))',
    'hsl(var(--chart-amber))',
    'hsl(var(--chart-violet))',
    'hsl(var(--chart-rose))',
  ];

  // Top products by category
  const categoryData = useMemo(() => {
    const catMap: Record<string, number> = {};
    products.forEach(p => {
      catMap[p.category] = (catMap[p.category] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, count]) => ({ name, count }));
  }, [products]);

  const CATEGORY_COLORS = [
    'hsl(var(--chart-blue))',
    'hsl(var(--chart-emerald))',
    'hsl(var(--chart-amber))',
    'hsl(var(--chart-violet))',
    'hsl(var(--chart-cyan))',
    'hsl(var(--chart-orange))',
  ];

  // Stock health radial
  const stockHealth = useMemo(() => {
    const inStock = products.filter(p => p.stock > 10).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const total = products.length || 1;
    return [
      { name: 'In Stock', value: Math.round((inStock / total) * 100), fill: 'hsl(var(--chart-emerald))' },
      { name: 'Low Stock', value: Math.round((lowStock / total) * 100), fill: 'hsl(var(--chart-amber))' },
      { name: 'Out of Stock', value: Math.round((outOfStock / total) * 100), fill: 'hsl(var(--chart-rose))' },
    ];
  }, [products]);

  // Customer growth (simulated monthly)
  const customerGrowth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((m, i) => ({
      name: m,
      customers: Math.floor(customers.length * (0.4 + i * 0.12)),
    }));
  }, [customers]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'chart-emerald',
      bgClass: 'from-chart-emerald/20 to-chart-emerald/5',
      iconBg: 'bg-chart-emerald/15',
      iconColor: 'text-chart-emerald',
      badgeClass: 'bg-chart-emerald/15 text-chart-emerald',
      barColor: 'bg-chart-emerald',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      change: '+8.2%',
      trend: 'up' as const,
      icon: ShoppingCart,
      color: 'chart-blue',
      bgClass: 'from-chart-blue/20 to-chart-blue/5',
      iconBg: 'bg-chart-blue/15',
      iconColor: 'text-chart-blue',
      badgeClass: 'bg-chart-blue/15 text-chart-blue',
      barColor: 'bg-chart-blue',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers.toString(),
      change: '+5.1%',
      trend: 'up' as const,
      icon: Users,
      color: 'chart-violet',
      bgClass: 'from-chart-violet/20 to-chart-violet/5',
      iconBg: 'bg-chart-violet/15',
      iconColor: 'text-chart-violet',
      badgeClass: 'bg-chart-violet/15 text-chart-violet',
      barColor: 'bg-chart-violet',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      change: '+2.4%',
      trend: 'up' as const,
      icon: Package,
      color: 'chart-amber',
      bgClass: 'from-chart-amber/20 to-chart-amber/5',
      iconBg: 'bg-chart-amber/15',
      iconColor: 'text-chart-amber',
      badgeClass: 'bg-chart-amber/15 text-chart-amber',
      barColor: 'bg-chart-amber',
    },
  ];

  const recentOrders = orders.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-chart-emerald/15 text-chart-emerald';
      case 'Processing': return 'bg-chart-blue/15 text-chart-blue';
      case 'Shipped': return 'bg-chart-cyan/15 text-chart-cyan';
      case 'Pending': return 'bg-chart-amber/15 text-chart-amber';
      case 'Cancelled': return 'bg-chart-rose/15 text-chart-rose';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'Processing': return <Clock className="h-3.5 w-3.5" />;
      case 'Shipped': return <Truck className="h-3.5 w-3.5" />;
      case 'Pending': return <Eye className="h-3.5 w-3.5" />;
      case 'Cancelled': return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  };

  return (
    <AdminLayout>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-3xl md:text-4xl neon-text flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-chart-amber" />
              ANALYTICS
            </h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Activity className="h-4 w-4 text-chart-blue" />
              Real-time overview of your store performance
            </p>
          </div>
          <Link to="/admin/products">
            <Button className="bg-chart-blue hover:bg-chart-blue/90 text-white transition-all duration-300 shadow-lg shadow-chart-blue/25">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              variants={itemVariants}
              className={`glass-card p-6 group hover-lift cursor-default bg-gradient-to-br ${stat.bgClass}`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <span className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${stat.badgeClass}`}>
                  {stat.change}
                  {stat.trend === 'up'
                    ? <ArrowUpRight className="h-3.5 w-3.5 ml-0.5" />
                    : <ArrowDownRight className="h-3.5 w-3.5 ml-0.5" />
                  }
                </span>
              </div>
              <div className="mt-5">
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
              {/* Mini sparkline decoration */}
              <div className="mt-4 h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${stat.barColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${60 + index * 10}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Revenue & Orders Chart */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-display text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-emerald" />
                  REVENUE OVERVIEW
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Monthly revenue & order trends</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-chart-emerald" />Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-chart-blue" />Orders
                </span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-emerald))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-emerald))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-card)',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-emerald))"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--chart-blue))"
                    strokeWidth={2}
                    fill="url(#ordersGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Order Status Pie */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-display text-lg flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-chart-violet" />
                ORDER STATUS
              </h2>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {orderStatusData.map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row: Category Breakdown + Customer Growth + Stock Health */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Category Bar Chart */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h2 className="text-display text-lg flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-chart-orange" />
              CATEGORIES
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cat-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Customer Growth */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h2 className="text-display text-lg flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-chart-violet" />
              CUSTOMER GROWTH
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={customerGrowth} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="custGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-violet))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(var(--chart-violet))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Area type="monotone" dataKey="customers" stroke="hsl(var(--chart-violet))" strokeWidth={2.5} fill="url(#custGrad)" dot={{ r: 3, fill: 'hsl(var(--chart-violet))' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Stock Health */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h2 className="text-display text-lg flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-chart-cyan" />
              STOCK HEALTH
            </h2>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  barSize={14}
                  data={stockHealth}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    background={{ fill: 'hsl(var(--muted))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {stockHealth.map(entry => (
                <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  {entry.name} ({entry.value}%)
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Orders Table */}
        <motion.div variants={itemVariants} className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-display text-lg">RECENT ORDERS</h2>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm" className="glass-button">
                View All
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.05 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm font-medium">{order.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-sm">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{order.items.length} item(s)</td>
                    <td className="p-4 font-semibold text-sm">{formatCurrency(order.total)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Products', path: '/admin/products', icon: Package, desc: 'Manage inventory', color: 'text-chart-amber', bgColor: 'group-hover:bg-chart-amber/10' },
            { label: 'Orders', path: '/admin/orders', icon: ShoppingCart, desc: 'View all orders', color: 'text-chart-blue', bgColor: 'group-hover:bg-chart-blue/10' },
            { label: 'Customers', path: '/admin/customers', icon: Users, desc: 'Customer base', color: 'text-chart-violet', bgColor: 'group-hover:bg-chart-violet/10' },
            { label: 'Settings', path: '/admin/settings', icon: Activity, desc: 'Store config', color: 'text-chart-emerald', bgColor: 'group-hover:bg-chart-emerald/10' },
          ].map((action) => (
            <Link key={action.path} to={action.path}>
              <div className={`glass-card p-5 hover-lift cursor-pointer group text-center transition-colors ${action.bgColor}`}>
                <action.icon className={`h-7 w-7 mx-auto mb-3 text-muted-foreground group-hover:${action.color} transition-colors`} />
                <p className="font-semibold text-sm">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
