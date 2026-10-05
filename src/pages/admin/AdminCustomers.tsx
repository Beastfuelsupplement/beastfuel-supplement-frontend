import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Edit, Trash2, User, Plus } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { useAdminStore, Customer } from '@/store/adminStore';
import CustomerModal from '@/components/admin/CustomerModal';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';

const AdminCustomers = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; customer: Customer | null }>({
    isOpen: false,
    customer: null,
  });

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const activeCustomers = customers.filter(c => c.status === 'Active').length;

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
      toast.success('Customer updated successfully');
    } else {
      addCustomer({
        name: customerData.name || '',
        email: customerData.email || '',
        status: customerData.status || 'Active',
      });
      toast.success('Customer added successfully');
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setDeleteConfirm({ isOpen: true, customer });
  };

  const confirmDelete = () => {
    if (deleteConfirm.customer) {
      deleteCustomer(deleteConfirm.customer.id);
      toast.success(`${deleteConfirm.customer.name} deleted successfully`);
    }
  };

  const handleSendEmail = (customer: Customer) => {
    toast.success(`Email dialog opened for ${customer.email}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-display text-3xl md:text-4xl bg-gradient-to-r from-emerald-600 via-violet-600 to-amber-600 dark:from-emerald-400 dark:via-violet-400 dark:to-amber-400 bg-clip-text text-transparent">CUSTOMERS</h1>
            <p className="text-muted-foreground">Manage your customer base</p>
          </div>
          <Button onClick={handleAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-lg p-6 shadow-lg"
          >
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{customers.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 rounded-lg p-6 shadow-lg"
          >
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-1">Active Customers</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{activeCustomers}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 border border-violet-500/30 rounded-lg p-6 shadow-lg"
          >
            <p className="text-sm text-violet-600 dark:text-violet-400 font-semibold mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">{formatCurrency(totalRevenue)}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Customers Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border border-emerald-500/20 rounded-lg overflow-hidden shadow-lg"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-violet-500/10">
                  <th className="text-left p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Customer</th>
                  <th className="text-left p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Orders</th>
                  <th className="text-left p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Spent</th>
                  <th className="text-left p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Joined</th>
                  <th className="text-left p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border last:border-0 hover:bg-emerald-500/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{customer.orders}</td>
                    <td className="p-4 font-medium">{formatCurrency(customer.totalSpent)}</td>
                    <td className="p-4 text-muted-foreground">{customer.joinedAt}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        customer.status === 'Active' 
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSendEmail(customer)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditCustomer(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteCustomer(customer)}
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

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        )}
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, customer: null })}
        onConfirm={confirmDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteConfirm.customer?.name}"? This action cannot be undone.`}
      />
    </AdminLayout>
  );
};

export default AdminCustomers;
