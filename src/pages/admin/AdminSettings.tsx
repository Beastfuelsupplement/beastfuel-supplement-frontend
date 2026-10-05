import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Bell, Shield, CreditCard, Save, Plus, Trash2, Edit2, Mail, Loader2 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminStore, PaymentMethod } from '@/store/adminStore';
import { checkAndNotifyLowStock } from '@/utils/stockNotification';

const AdminSettings = () => {
  const { settings, updateSettings, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, products } = useAdminStore();
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: '',
    type: 'card' as PaymentMethod['type'],
    enabled: true,
    description: '',
  });

  const handleSendTestEmail = async () => {
    const email = localSettings.adminEmail;
    if (!email) {
      toast.error('Please enter an admin email first');
      return;
    }

    setIsSendingTestEmail(true);
    try {
      // Send a test notification with sample products
      const threshold = localSettings.lowStockThreshold || 10;
      const testProducts = products.length > 0 
        ? products.slice(0, 3).map(p => ({ ...p, stock: threshold - 1 })) // Use first 3 products with low stock
        : [{ id: 'test-1', name: 'Sample Product 1', stock: threshold - 1 }, { id: 'test-2', name: 'Sample Product 2', stock: 0 }];
      
      const result = await checkAndNotifyLowStock(testProducts as any, email, threshold);
      
      if (result.success) {
        toast.success('Test email sent! Check your inbox.');
      } else {
        toast.error(`Failed to send test email: ${result.error}`);
      }
    } catch (error) {
      toast.error('Failed to send test email');
      console.error('Test email error:', error);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Settings saved successfully');
  };

  const handleToggle = (key: keyof typeof localSettings) => {
    if (typeof localSettings[key] === 'boolean') {
      setLocalSettings({ ...localSettings, [key]: !localSettings[key] });
    }
  };

  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.name || !newPaymentMethod.description) {
      toast.error('Please fill in all fields');
      return;
    }
    addPaymentMethod(newPaymentMethod);
    setNewPaymentMethod({ name: '', type: 'card', enabled: true, description: '' });
    setIsAddingPayment(false);
    toast.success('Payment method added');
  };

  const handleUpdatePaymentMethod = () => {
    if (!editingPayment) return;
    updatePaymentMethod(editingPayment.id, editingPayment);
    setEditingPayment(null);
    toast.success('Payment method updated');
  };

  const handleDeletePaymentMethod = (id: string) => {
    deletePaymentMethod(id);
    toast.success('Payment method deleted');
  };

  const handleTogglePaymentMethod = (id: string, enabled: boolean) => {
    updatePaymentMethod(id, { enabled });
    toast.success(`Payment method ${enabled ? 'enabled' : 'disabled'}`);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-display text-3xl md:text-4xl">SETTINGS</h1>
          <p className="text-muted-foreground">Configure your store settings</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Tabs */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-lg p-6"
            >
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-display text-xl mb-6">GENERAL SETTINGS</h2>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Store Name</label>
                      <input
                        type="text"
                        value={localSettings.storeName}
                        onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                        className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                          type="email"
                          value={localSettings.storeEmail}
                          onChange={(e) => setLocalSettings({ ...localSettings, storeEmail: e.target.value })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Phone</label>
                        <input
                          type="tel"
                          value={localSettings.storePhone}
                          onChange={(e) => setLocalSettings({ ...localSettings, storePhone: e.target.value })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={localSettings.storeAddress}
                        onChange={(e) => setLocalSettings({ ...localSettings, storeAddress: e.target.value })}
                        className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Currency</label>
                        <select
                          value={localSettings.currency}
                          onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Timezone</label>
                        <select
                          value={localSettings.timezone}
                          onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="America/New_York">Eastern Time</option>
                          <option value="America/Chicago">Central Time</option>
                          <option value="America/Los_Angeles">Pacific Time</option>
                          <option value="Europe/London">London</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-display text-xl mb-6">NOTIFICATION SETTINGS</h2>
                  
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Admin Email (for notifications)</label>
                        <input
                          type="email"
                          value={localSettings.adminEmail || ''}
                          onChange={(e) => setLocalSettings({ ...localSettings, adminEmail: e.target.value })}
                          placeholder="admin@example.com"
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground mt-1">This email will receive low stock and new order notifications</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={localSettings.lowStockThreshold || 10}
                          onChange={(e) => setLocalSettings({ ...localSettings, lowStockThreshold: parseInt(e.target.value) || 10 })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Products with stock at or below this number trigger alerts</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive email updates about your store</p>
                      </div>
                      <button
                        onClick={() => handleToggle('emailNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          localSettings.emailNotifications ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`block w-5 h-5 bg-background rounded-full transition-transform ${
                          localSettings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">Order Notifications</p>
                        <p className="text-sm text-muted-foreground">Get notified when new orders come in</p>
                      </div>
                      <button
                        onClick={() => handleToggle('orderNotifications')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          localSettings.orderNotifications ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`block w-5 h-5 bg-background rounded-full transition-transform ${
                          localSettings.orderNotifications ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">Receive tips and updates from BEASTFUEL</p>
                      </div>
                      <button
                        onClick={() => handleToggle('marketingEmails')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          localSettings.marketingEmails ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`block w-5 h-5 bg-background rounded-full transition-transform ${
                          localSettings.marketingEmails ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="font-medium mb-2">Test Email Configuration</p>
                      <p className="text-sm text-muted-foreground mb-4">Send a test low stock notification to verify your email settings are working correctly.</p>
                      <Button 
                        variant="outline"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTestEmail || !localSettings.adminEmail}
                      >
                        {isSendingTestEmail ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Test Email
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-display text-xl mb-6">SECURITY SETTINGS</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <button
                        onClick={() => handleToggle('twoFactorAuth')}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          localSettings.twoFactorAuth ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span className={`block w-5 h-5 bg-background rounded-full transition-transform ${
                          localSettings.twoFactorAuth ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                      <select
                        value={localSettings.sessionTimeout}
                        onChange={(e) => setLocalSettings({ ...localSettings, sessionTimeout: e.target.value })}
                        className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>

                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="font-medium mb-2">Change Password</p>
                      <p className="text-sm text-muted-foreground mb-4">Update your admin password</p>
                      <Button 
                        variant="outline"
                        onClick={() => toast.info('Password change feature coming soon')}
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-display text-xl">PAYMENT METHODS</h2>
                    <Button onClick={() => setIsAddingPayment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Method
                    </Button>
                  </div>
                  
                  {/* Add Payment Modal */}
                  {isAddingPayment && (
                    <div className="p-4 bg-secondary rounded-lg space-y-4">
                      <h3 className="font-medium">Add New Payment Method</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Name</label>
                          <input
                            type="text"
                            value={newPaymentMethod.name}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                            placeholder="e.g., Credit Card"
                            className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Type</label>
                          <select
                            value={newPaymentMethod.type}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as PaymentMethod['type'] })}
                            className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="card">Card</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash_on_delivery">Cash on Delivery</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <input
                          type="text"
                          value={newPaymentMethod.description}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, description: e.target.value })}
                          placeholder="e.g., Accept Visa, MasterCard"
                          className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddPaymentMethod}>Save</Button>
                        <Button variant="outline" onClick={() => setIsAddingPayment(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Edit Payment Modal */}
                  {editingPayment && (
                    <div className="p-4 bg-secondary rounded-lg space-y-4">
                      <h3 className="font-medium">Edit Payment Method</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Name</label>
                          <input
                            type="text"
                            value={editingPayment.name}
                            onChange={(e) => setEditingPayment({ ...editingPayment, name: e.target.value })}
                            className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Type</label>
                          <select
                            value={editingPayment.type}
                            onChange={(e) => setEditingPayment({ ...editingPayment, type: e.target.value as PaymentMethod['type'] })}
                            className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="card">Card</option>
                            <option value="paypal">PayPal</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash_on_delivery">Cash on Delivery</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <input
                          type="text"
                          value={editingPayment.description}
                          onChange={(e) => setEditingPayment({ ...editingPayment, description: e.target.value })}
                          className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdatePaymentMethod}>Update</Button>
                        <Button variant="outline" onClick={() => setEditingPayment(null)}>Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* Payment Methods List */}
                  <div className="space-y-4">
                    {settings.paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div className="flex items-center gap-4">
                          <CreditCard className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{method.name}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                            <span className={`text-xs ${method.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {method.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTogglePaymentMethod(method.id, !method.enabled)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              method.enabled ? 'bg-primary' : 'bg-muted'
                            }`}
                          >
                            <span className={`block w-5 h-5 bg-background rounded-full transition-transform ${
                              method.enabled ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingPayment(method)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeletePaymentMethod(method.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {settings.paymentMethods.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment methods configured. Add one to get started.
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;