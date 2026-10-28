import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Eye, Trash2, Printer, RotateCcw, Package, Archive, AlertTriangle, FileText } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminStore, Order, DeletedOrder, PaymentDetails, isMockOrder } from '@/store/adminStore';
import { useOrders, useUpdateOrderStatus, useDeleteOrder } from '@/hooks/useOrders';
import OrderModal from '@/components/admin/OrderModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { printOrdersReport, printDeletedOrdersReport, printSingleOrderInvoice } from '@/utils/orderReportPrinter';

const AdminOrders = () => {
  const { data: dbOrders = [] } = useOrders();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const deleteOrderMutation = useDeleteOrder();

  const { 
    orders: storeOrders = [], 
    deletedOrders = [], 
    updateOrderStatus, 
    updatePaymentStatus, 
    deleteOrder, 
    restoreOrder, 
    permanentlyDeleteOrder 
  } = useAdminStore();

  const orders = (dbOrders.length > 0 ? dbOrders : storeOrders).filter(o => !isMockOrder(o));

  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | DeletedOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('Customer cancellation / Admin removal');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; order: Order | DeletedOrder | null; isPermanent?: boolean }>({
    isOpen: false,
    order: null,
    isPermanent: false,
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

  const filteredDeletedOrders = (deletedOrders || []).filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.deletionReason && order.deletionReason.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const handleViewOrder = (order: Order | DeletedOrder) => {
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
    setDeletionReason('Admin removed order');
    setDeleteConfirm({ isOpen: true, order, isPermanent: false });
  };

  const handlePermanentDelete = (order: DeletedOrder) => {
    setDeleteConfirm({ isOpen: true, order, isPermanent: true });
  };

  const handleRestoreOrder = (order: DeletedOrder) => {
    restoreOrder(order.id);
    toast.success(`Order ${order.id} restored to Active Orders list`);
  };

  const confirmDelete = () => {
    if (deleteConfirm.order) {
      if (deleteConfirm.isPermanent) {
        permanentlyDeleteOrder(deleteConfirm.order.id);
        toast.success(`Order ${deleteConfirm.order.id} permanently purged`);
      } else {
        deleteOrder(deleteConfirm.order.id, deletionReason, 'Admin User');
        toast.success(`Order ${deleteConfirm.order.id} moved to Deleted Orders Archive`, {
          action: {
            label: 'View Deleted',
            onClick: () => setActiveTab('deleted'),
          },
        });
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header & Print Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-display text-3xl md:text-4xl bg-gradient-to-r from-blue-600 via-violet-600 to-rose-600 dark:from-blue-400 dark:via-violet-400 dark:to-rose-400 bg-clip-text text-transparent">
              ORDERS
            </h1>
            <p className="text-muted-foreground">
              {activeTab === 'active' 
                ? `Manage customer orders (${orders.length} total)` 
                : `Audit trail for deleted orders (${(deletedOrders || []).length} total)`
              }
            </p>
          </motion.div>

          {/* Master Print Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTab === 'active' ? (
              <Button
                onClick={() => printOrdersReport(filteredOrders, { status: statusFilter, payment: paymentFilter, search: searchQuery })}
                className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md font-semibold"
              >
                <Printer className="h-4 w-4" />
                <span>Print Orders Report ({filteredOrders.length})</span>
              </Button>
            ) : (
              <Button
                onClick={() => printDeletedOrdersReport(filteredDeletedOrders)}
                disabled={(filteredDeletedOrders || []).length === 0}
                className="gap-2 bg-rose-600 hover:bg-rose-700 text-white shadow-md font-semibold disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                <span>Print Deleted Orders Report ({filteredDeletedOrders.length})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'active'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Active Orders</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'active' ? 'bg-black/20 text-white' : 'bg-secondary text-foreground'}`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('deleted')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === 'deleted'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Archive className="h-4 w-4" />
            <span>Deleted Orders</span>
            {(deletedOrders || []).length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'deleted' ? 'bg-black/20 text-white' : 'bg-rose-500/20 text-rose-500'}`}>
                {deletedOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === 'active' ? "Search by Order ID, customer, email..." : "Search deleted orders or reasons..."}
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

        {/* ACTIVE ORDERS TAB */}
        {activeTab === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-sm border border-blue-500/20 rounded-lg overflow-hidden shadow-lg"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-violet-500/10">
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Order ID</th>
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Customer</th>
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Date</th>
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Items</th>
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Payment</th>
                    <th className="text-center p-4 text-sm font-semibold text-blue-600 dark:text-blue-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b border-border last:border-0 hover:bg-blue-500/5 transition-colors"
                    >
                      <td className="p-4 font-mono font-medium">{order.id}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{order.createdAt}</td>
                      <td className="p-4">{order.items?.length || 1} item(s)</td>
                      <td className="p-4 font-medium font-mono">{formatCurrency(order.total)}</td>
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
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1-Click Print Order Invoice */}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => printSingleOrderInvoice(order)}
                            title="Print Order Invoice / Report"
                            className="hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Printer className="h-4 w-4 text-blue-500" />
                          </Button>

                          {/* View Order */}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewOrder(order)}
                            title="View Order Details"
                            className="hover:bg-secondary transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Delete Order */}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteOrder(order)}
                            title="Delete Order (Archive)"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
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

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No active orders found matching your filters.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* DELETED ORDERS ARCHIVE TAB */}
        {activeTab === 'deleted' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <div>
                  <h3 className="font-semibold text-rose-600 dark:text-rose-400 text-sm">Deleted Orders Archive & Audit Register</h3>
                  <p className="text-xs text-muted-foreground">
                    All deleted orders are preserved here for accountability and compliance. You can print official audit reports or restore any order.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => printDeletedOrdersReport(filteredDeletedOrders)}
                disabled={(filteredDeletedOrders || []).length === 0}
                className="gap-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                <Printer className="h-4 w-4" />
                <span>Print Audit Report</span>
              </Button>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-rose-500/20 rounded-lg overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px]">
                  <thead>
                    <tr className="border-b border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-amber-500/10">
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Order ID</th>
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Customer</th>
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Deleted At</th>
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Deleted By / Reason</th>
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Items</th>
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Amount</th>
                      <th className="text-left p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Orig. Status</th>
                      <th className="text-center p-4 text-sm font-semibold text-rose-600 dark:text-rose-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeletedOrders.map((order, index) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="border-b border-border last:border-0 hover:bg-rose-500/5 transition-colors"
                      >
                        <td className="p-4 font-mono font-bold text-rose-500">{order.id}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-rose-600 dark:text-rose-400 font-medium">
                          {order.deletedAt}
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-xs">{order.deletedBy || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground italic">{order.deletionReason || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="p-4">{order.items?.length || 1} item(s)</td>
                        <td className="p-4 font-mono font-medium">{formatCurrency(order.total)}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Print Deleted Order Slip */}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => printSingleOrderInvoice(order)}
                              title="Print Deleted Order Details"
                              className="hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Printer className="h-4 w-4 text-blue-500" />
                            </Button>

                            {/* View Order Modal */}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewOrder(order)}
                              title="View Order Details"
                              className="hover:bg-secondary transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Restore Order */}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRestoreOrder(order)}
                              title="Restore Order back to Active list"
                              className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>

                            {/* Permanently Delete */}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handlePermanentDelete(order)}
                              title="Permanently Purge Record"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
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

              {filteredDeletedOrders.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No deleted orders in archive.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Order Details Modal with built-in Print Invoice action */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
      />

      {/* Delete / Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, order: null, isPermanent: false })}
        onConfirm={confirmDelete}
        title={deleteConfirm.isPermanent ? "Permanently Purge Order" : "Archive Order as Deleted"}
        message={
          deleteConfirm.isPermanent
            ? `Are you sure you want to permanently remove order "${deleteConfirm.order?.id}" from the archive? This cannot be undone.`
            : `Are you sure you want to delete order "${deleteConfirm.order?.id}"? It will be moved to the Deleted Orders Archive where it will remain available for audit reporting and restoration.`
        }
      />
    </AdminLayout>
  );
};

export default AdminOrders;