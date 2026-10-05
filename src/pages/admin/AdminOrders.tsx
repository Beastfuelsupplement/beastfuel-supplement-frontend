import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Trash2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminStore, Order, PaymentDetails } from '@/store/adminStore';
import OrderModal from '@/components/admin/OrderModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

const AdminOrders = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, deleteOrder } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; order: Order | null }>({
    isOpen: false,
    order: null,
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'All' || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
      case 'Processing': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30';
      case 'Shipped': return 'bg-violet-500/20 text-violet-700 dark:text-violet-400 border border-violet-500/30';
      case 'Pending': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30';
      case 'Cancelled': return 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30';
      case 'Pending': return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30';
      case 'Failed': return 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30';
      case 'Refunded': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = (id: string, status: Order['status']) => {
    updateOrderStatus(id, status);
    setSelectedOrder(prev => prev ? { ...prev, status } : null);
    toast.success(`Order status updated to ${status}`);
  };

  const handleUpdatePaymentStatus = (id: string, paymentStatus: Order['paymentStatus'], paymentDetails?: PaymentDetails) => {
    updatePaymentStatus(id, paymentStatus, paymentDetails);
    setSelectedOrder(prev => prev ? { ...prev, paymentStatus, paymentDetails: paymentDetails || prev.paymentDetails } : null);
    toast.success(`Payment status updated to ${paymentStatus}`);
  };

  const handleDeleteOrder = (order: Order) => {
    setDeleteConfirm({ isOpen: true, order });
  };

  const confirmDelete = () => {
    if (deleteConfirm.order) {
      deleteOrder(deleteConfirm.order.id);
      toast.success(`Order ${deleteConfirm.order.id} deleted`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-display text-3xl md:text-4xl bg-gradient-to-r from-blue-600 via-violet-600 to-rose-600 dark:from-blue-400 dark:via-violet-400 dark:to-rose-400 bg-clip-text text-transparent">ORDERS</h1>
          <p className="text-muted-foreground">Manage customer orders ({orders.length} total)</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="All">All Payments</option>
            <option value="Pending">Payment Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border border-blue-500/20 rounded-lg overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-violet-500/10">
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Order ID</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Customer</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Date</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Items</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Amount</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Payment</th>
                  <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border last:border-0 hover:bg-blue-500/5 transition-colors"
                  >
                    <td className="p-4 font-medium">{order.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{order.createdAt}</td>
                    <td className="p-4">{order.items.length} item(s)</td>
                    <td className="p-4 font-medium">{formatCurrency(order.total)}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteOrder(order)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        )}
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, order: null })}
        onConfirm={confirmDelete}
        title="Delete Order"
        message={`Are you sure you want to delete order "${deleteConfirm.order?.id}"? This action cannot be undone.`}
      />
    </AdminLayout>
  );
};

export default AdminOrders;