import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Package, Settings, Mail, Phone, MapPin, 
  Calendar, CreditCard, Bell, Shield,
  Edit2, Save, X, ChevronRight, ShoppingBag, Lock, AlertCircle,
  TrendingUp, Heart, Star
} from 'lucide-react';
import { TwoFactorAuth } from '@/components/security/TwoFactorAuth';
import { ActivityLog } from '@/components/security/ActivityLog';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStore, Order } from '@/store/adminStore';
import { formatCurrency } from '@/lib/currency';
import { z } from 'zod';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, updatePassword, updateEmail } = useAuth();
  const { orders } = useAdminStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Email change modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: '' });
  const [emailErrors, setEmailErrors] = useState<{ email?: string }>({});
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: '',
        address: '',
      });
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Get user orders
  const userOrders = orders.filter(
    (order: Order) => order.customerEmail.toLowerCase() === user?.email?.toLowerCase()
  );

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = () => {
    // TODO: Update profile in Supabase
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    
    const result = passwordSchema.safeParse(passwordForm);
    if (!result.success) {
      const errors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'password') errors.password = err.message;
        if (err.path[0] === 'confirmPassword') errors.confirmPassword = err.message;
      });
      setPasswordErrors(errors);
      return;
    }

    setIsUpdatingPassword(true);
    const { success, error } = await updatePassword(passwordForm.password);
    setIsUpdatingPassword(false);

    if (success) {
      toast.success('Password updated successfully!');
      setIsPasswordModalOpen(false);
      setPasswordForm({ password: '', confirmPassword: '' });
    } else {
      toast.error(error || 'Failed to update password');
    }
  };

  const handleUpdateEmail = async () => {
    setEmailErrors({});
    
    const result = emailSchema.safeParse(emailForm);
    if (!result.success) {
      const errors: { email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') errors.email = err.message;
      });
      setEmailErrors(errors);
      return;
    }

    setIsUpdatingEmail(true);
    const { success, error } = await updateEmail(emailForm.email);
    setIsUpdatingEmail(false);

    if (success) {
      toast.success('Confirmation email sent! Please check your inbox to verify your new email.');
      setIsEmailModalOpen(false);
      setEmailForm({ email: '' });
    } else {
      toast.error(error || 'Failed to update email');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-chart-emerald/15 text-chart-emerald border-chart-emerald/30';
      case 'shipped': return 'bg-chart-blue/15 text-chart-blue border-chart-blue/30';
      case 'processing': return 'bg-chart-violet/15 text-chart-violet border-chart-violet/30';
      case 'pending': return 'bg-chart-amber/15 text-chart-amber border-chart-amber/30';
      case 'cancelled': return 'bg-chart-rose/15 text-chart-rose border-chart-rose/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Layout accent="green">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout accent="green">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-chart-blue/10 via-chart-violet/5 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">MY ACCOUNT</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, <span className="text-chart-blue font-medium">{user.name}</span>
            </p>
            {/* Quick Stats Row */}
            <div className="flex justify-center gap-6 mt-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 glass-card px-4 py-2"
              >
                <Package className="h-4 w-4 text-chart-blue" />
                <span className="text-sm font-medium">{userOrders.length} Orders</span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 glass-card px-4 py-2"
              >
                <CreditCard className="h-4 w-4 text-chart-emerald" />
                <span className="text-sm font-medium">{formatCurrency(userOrders.reduce((sum, o) => sum + o.total, 0))}</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="glass-card p-1 w-full md:w-auto grid grid-cols-3 md:inline-flex gap-1">
              <TabsTrigger 
                value="orders" 
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Orders</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="preferences"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-display text-2xl">ORDER HISTORY</h2>
                    <Button variant="glass" size="sm" onClick={() => navigate('/order-history')}>
                      View All Orders
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  
                  {userOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Start shopping to see your orders here
                      </p>
                      <Button variant="hero" onClick={() => navigate('/products')}>
                        Browse Products
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOrders.map((order: Order) => (
                        <div
                          key={order.id}
                          className="glass p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-mono text-sm text-muted-foreground">
                                  #{order.id.slice(-8).toUpperCase()}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                </p>
                                <p className="text-lg font-bold text-chart-emerald">
                                  {formatCurrency(order.total)}
                                </p>
                              </div>
                              <Button variant="glass" size="sm" onClick={() => navigate(`/order-history/${order.id}`)}>
                                View Details
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Order Items Preview */}
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex flex-wrap gap-2">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-secondary/50 px-2 py-1 rounded-md"
                                >
                                  {item.productName} x{item.quantity}
                                </span>
                              ))}
                              {order.items.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{order.items.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 md:grid-cols-2"
              >
                {/* Profile Info Card */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-display text-2xl">PROFILE INFO</h2>
                    {!isEditing ? (
                      <Button variant="glass" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="glass" size="sm" onClick={() => setIsEditing(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                        <Button variant="hero" size="sm" onClick={handleSaveProfile}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <p className="text-lg font-medium">{user.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </label>
                      <p className="text-lg font-medium">{user.email}</p>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          placeholder="Add phone number"
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <p className="text-lg font-medium text-muted-foreground">
                          {profileData.phone || 'Not provided'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address"
                          value={profileData.address}
                          onChange={handleProfileChange}
                          placeholder="Add your address"
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      ) : (
                        <p className="text-lg font-medium text-muted-foreground">
                          {profileData.address || 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Details Card */}
                <div className="glass-card p-6">
                  <h2 className="text-display text-2xl mb-6">ACCOUNT DETAILS</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-chart-violet/10 rounded-lg border border-chart-violet/20">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-chart-violet" />
                        <div>
                          <p className="text-sm text-muted-foreground">Account Type</p>
                          <p className="font-medium capitalize">{user.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-chart-blue/10 rounded-lg border border-chart-blue/20">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-chart-blue" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Orders</p>
                          <p className="font-medium">{userOrders.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-chart-emerald/10 rounded-lg border border-chart-emerald/20">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-chart-emerald" />
                        <div>
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                          <p className="font-medium text-chart-emerald">
                            {formatCurrency(userOrders.reduce((sum, order) => sum + order.total, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-6 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 md:grid-cols-2"
              >
                {/* Notification Settings */}
                <div className="glass-card p-6">
                  <h2 className="text-display text-2xl mb-6">NOTIFICATIONS</h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, emailNotifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Get notified about order status
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.orderUpdates}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, orderUpdates: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Promotions</p>
                          <p className="text-sm text-muted-foreground">
                            Receive promotional emails
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.promotions}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, promotions: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Newsletter</p>
                          <p className="text-sm text-muted-foreground">
                            Weekly fitness tips & news
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={preferences.newsletter}
                        onCheckedChange={(checked) =>
                          setPreferences({ ...preferences, newsletter: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="glass-card p-6">
                  <h2 className="text-display text-2xl mb-6">SECURITY</h2>

                  <div className="space-y-4">
                    {/* Two-Factor Authentication */}
                    <TwoFactorAuth />

                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setIsPasswordModalOpen(true)}
                    >
                      <Lock className="h-5 w-5 mr-3" />
                      Change Password
                    </Button>

                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setIsEmailModalOpen(true)}
                    >
                      <Mail className="h-5 w-5 mr-3" />
                      Update Email
                    </Button>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="md:col-span-2">
                  <ActivityLog />
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-display text-xl">CHANGE PASSWORD</DialogTitle>
            <DialogDescription>
              Enter your new password below. Make sure it's strong and secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">New Password</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter new password"
              />
              {passwordErrors.password && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {passwordErrors.password}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Confirm Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Confirm new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordForm({ password: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleChangePassword}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Email Modal */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-display text-xl">UPDATE EMAIL</DialogTitle>
            <DialogDescription>
              Enter your new email address. You'll receive a confirmation email to verify the change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Current Email</label>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">New Email Address</label>
              <input
                type="email"
                value={emailForm.email}
                onChange={(e) => setEmailForm({ email: e.target.value })}
                className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter new email address"
              />
              {emailErrors.email && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {emailErrors.email}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setEmailForm({ email: '' });
                  setEmailErrors({});
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail}
              >
                {isUpdatingEmail ? 'Updating...' : 'Update Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
