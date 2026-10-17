import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  Bell, 
  Shield, 
  CreditCard, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Mail, 
  Loader2, 
  Phone, 
  MapPin, 
  Clock, 
  Share2, 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  ExternalLink,
  MessageCircle,
  Video
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminStore, PaymentMethod } from '@/store/adminStore';
import { checkAndNotifyLowStock } from '@/utils/stockNotification';
import { useSettings } from '@/hooks/useSettings';

const AdminSettings = () => {
  const { settings, updateSettings, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, products } = useAdminStore();
  const { settings: apiSettings, updateSettings: updateApiSettings, loading: isApiLoading } = useSettings();

  const [activeTab, setActiveTab] = useState('contact_social');
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    tagline: apiSettings.tagline || settings.tagline || 'Fuel Your Ascent. Premium supplements for peak performance and optimal recovery.',
    workingHours: apiSettings.workingHours || settings.workingHours || 'Mon - Fri: 9AM - 6PM',
    weekendHours: apiSettings.weekendHours || settings.weekendHours || 'Sat - Sun: Closed',
    contactSubtext: apiSettings.contactSubtext || settings.contactSubtext || 'We reply within 24 hours',
    socialLinks: {
      instagram: apiSettings.socialLinks?.instagram || settings.socialLinks?.instagram || 'https://instagram.com/beastfuel',
      twitter: apiSettings.socialLinks?.twitter || settings.socialLinks?.twitter || 'https://twitter.com/beastfuel',
      youtube: apiSettings.socialLinks?.youtube || settings.socialLinks?.youtube || 'https://youtube.com/@beastfuel',
      facebook: apiSettings.socialLinks?.facebook || settings.socialLinks?.facebook || 'https://facebook.com/beastfuel',
      whatsapp: apiSettings.socialLinks?.whatsapp || settings.socialLinks?.whatsapp || '',
      tiktok: apiSettings.socialLinks?.tiktok || settings.socialLinks?.tiktok || '',
    },
  });

  // Sync when API settings load or change
  useEffect(() => {
    if (apiSettings) {
      setLocalSettings((prev) => ({
        ...prev,
        storeName: apiSettings.storeName || prev.storeName,
        tagline: apiSettings.tagline || prev.tagline,
        storeEmail: apiSettings.storeEmail || prev.storeEmail,
        storePhone: apiSettings.storePhone || prev.storePhone,
        storeAddress: apiSettings.storeAddress || prev.storeAddress,
        workingHours: apiSettings.workingHours || prev.workingHours,
        weekendHours: apiSettings.weekendHours || prev.weekendHours,
        contactSubtext: apiSettings.contactSubtext || prev.contactSubtext,
        currency: apiSettings.currency || prev.currency,
        timezone: apiSettings.timezone || prev.timezone,
        adminEmail: apiSettings.adminEmail || prev.adminEmail,
        lowStockThreshold: apiSettings.lowStockThreshold || prev.lowStockThreshold,
        socialLinks: {
          ...prev.socialLinks,
          ...(apiSettings.socialLinks || {}),
        },
      }));
    }
  }, [apiSettings]);

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
      const threshold = localSettings.lowStockThreshold || 10;
      const testProducts = products.length > 0 
        ? products.slice(0, 3).map(p => ({ ...p, stock: threshold - 1 }))
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update backend MongoDB database via API so all website visitors see changes
      const success = await updateApiSettings({
        storeName: localSettings.storeName,
        tagline: localSettings.tagline,
        storeEmail: localSettings.storeEmail,
        storePhone: localSettings.storePhone,
        storeAddress: localSettings.storeAddress,
        workingHours: localSettings.workingHours,
        weekendHours: localSettings.weekendHours,
        contactSubtext: localSettings.contactSubtext,
        socialLinks: localSettings.socialLinks,
        currency: localSettings.currency,
        timezone: localSettings.timezone,
        adminEmail: localSettings.adminEmail,
        lowStockThreshold: localSettings.lowStockThreshold,
      });

      // 2. Update local state store
      updateSettings(localSettings);

      if (success) {
        toast.success('Settings & contact information updated across the entire website!');
      } else {
        toast.success('Settings saved to local storage!');
      }
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSocialLinkChange = (key: keyof typeof localSettings.socialLinks, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
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
    { id: 'contact_social', label: 'Contact & Social Links', icon: Share2 },
    { id: 'general', label: 'General Store', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display text-3xl md:text-4xl">STORE SETTINGS</h1>
            <p className="text-muted-foreground">
              Manage website contact details, social media handles, and store configuration
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isApiLoading}
            className="gap-2 font-bold uppercase tracking-wider self-start sm:self-auto"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Tabs Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1 bg-card border border-border rounded-xl p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Quick Helper Note */}
            <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground space-y-2">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-primary" /> Real-Time Sync
              </div>
              <p>
                Updating contact info and social links updates the website footer, contact page, and email receipts immediately for all visitors.
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6"
            >
              {/* TAB 1: Contact & Social Media Links */}
              {activeTab === 'contact_social' && (
                <div className="space-y-8">
                  {/* Section 1: Contact Information */}
                  <div className="space-y-4">
                    <div className="border-b border-border/80 pb-3">
                      <h2 className="text-display text-xl flex items-center gap-2">
                        <Phone className="w-5 h-5 text-primary" />
                        WEBSITE CONTACT INFORMATION
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        These details appear in the Website Footer and Contact Us page
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Support Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={localSettings.storeEmail}
                            onChange={(e) => setLocalSettings({ ...localSettings, storeEmail: e.target.value })}
                            placeholder="support@beastfuel.com"
                            className="w-full h-11 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Support Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={localSettings.storePhone}
                            onChange={(e) => setLocalSettings({ ...localSettings, storePhone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            className="w-full h-11 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Store Physical Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={localSettings.storeAddress}
                          onChange={(e) => setLocalSettings({ ...localSettings, storeAddress: e.target.value })}
                          placeholder="123 Fitness Street, Gym City, GC 12345"
                          className="w-full h-11 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Weekday Business Hours
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={localSettings.workingHours}
                            onChange={(e) => setLocalSettings({ ...localSettings, workingHours: e.target.value })}
                            placeholder="Mon - Fri: 9AM - 6PM"
                            className="w-full h-11 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Weekend / Alternate Hours
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={localSettings.weekendHours}
                            onChange={(e) => setLocalSettings({ ...localSettings, weekendHours: e.target.value })}
                            placeholder="Sat - Sun: Closed"
                            className="w-full h-11 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Footer Tagline / Brand Statement
                      </label>
                      <textarea
                        rows={2}
                        value={localSettings.tagline}
                        onChange={(e) => setLocalSettings({ ...localSettings, tagline: e.target.value })}
                        placeholder="Fuel Your Ascent. Premium supplements for peak performance and optimal recovery."
                        className="w-full p-3 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                    </div>
                  </div>

                  {/* Section 2: Social Media Links */}
                  <div className="space-y-4 pt-4 border-t border-border/80">
                    <div className="border-b border-border/80 pb-3">
                      <h2 className="text-display text-xl flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        SOCIAL MEDIA ACCOUNTS & LINKS
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Connect your brand handles. Clicking these icons in the footer opens your direct profiles.
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Instagram */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram URL
                          </label>
                          {localSettings.socialLinks.instagram && (
                            <a
                              href={localSettings.socialLinks.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              Test <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={localSettings.socialLinks.instagram}
                          onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                          placeholder="https://instagram.com/beastfuel"
                          className="w-full h-11 px-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Twitter / X */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Twitter className="w-3.5 h-3.5 text-sky-400" /> Twitter / X URL
                          </label>
                          {localSettings.socialLinks.twitter && (
                            <a
                              href={localSettings.socialLinks.twitter}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              Test <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={localSettings.socialLinks.twitter}
                          onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                          placeholder="https://twitter.com/beastfuel"
                          className="w-full h-11 px-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* YouTube */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Channel URL
                          </label>
                          {localSettings.socialLinks.youtube && (
                            <a
                              href={localSettings.socialLinks.youtube}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              Test <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={localSettings.socialLinks.youtube}
                          onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                          placeholder="https://youtube.com/@beastfuel"
                          className="w-full h-11 px-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Facebook */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Facebook className="w-3.5 h-3.5 text-blue-500" /> Facebook Page URL
                          </label>
                          {localSettings.socialLinks.facebook && (
                            <a
                              href={localSettings.socialLinks.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              Test <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <input
                          type="url"
                          value={localSettings.socialLinks.facebook}
                          onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                          placeholder="https://facebook.com/beastfuel"
                          className="w-full h-11 px-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* WhatsApp (Optional) */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Direct Link (Optional)
                        </label>
                        <input
                          type="text"
                          value={localSettings.socialLinks.whatsapp || ''}
                          onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
                          placeholder="https://wa.me/94771234567"
                          className="w-full h-11 px-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* TikTok (Optional) */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-purple-400" /> TikTok Profile URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={localSettings.socialLinks.tiktok || ''}
                          onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                          placeholder="https://tiktok.com/@beastfuel"
                          className="w-full h-11 px-4 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Live Preview of Website Footer Area */}
                  <div className="pt-4 border-t border-border/80">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                      <span>Live Footer Preview (How it looks on webpage)</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white space-y-4">
                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Brand & Social Preview */}
                        <div className="space-y-3">
                          <div className="text-lg font-black tracking-wider text-white">BEASTFUEL</div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {localSettings.tagline || 'Fuel Your Ascent. Premium supplements for peak performance.'}
                          </p>
                          <div className="flex gap-2 pt-1">
                            {localSettings.socialLinks.instagram && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                                <Instagram className="w-4 h-4 text-pink-400" />
                              </div>
                            )}
                            {localSettings.socialLinks.twitter && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                                <Twitter className="w-4 h-4 text-sky-400" />
                              </div>
                            )}
                            {localSettings.socialLinks.youtube && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                                <Youtube className="w-4 h-4 text-red-500" />
                              </div>
                            )}
                            {localSettings.socialLinks.facebook && (
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                                <Facebook className="w-4 h-4 text-blue-500" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Block Preview */}
                        <div className="space-y-2.5">
                          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">CONTACT</div>
                          <div className="text-xs text-zinc-300 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{localSettings.storeAddress || '123 Fitness Street, Gym City, GC 12345'}</span>
                          </div>
                          <div className="text-xs text-zinc-300 flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{localSettings.storePhone || '+1 (555) 123-4567'}</span>
                          </div>
                          <div className="text-xs text-zinc-300 flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{localSettings.storeEmail || 'support@beastfuel.com'}</span>
                          </div>
                          <div className="text-xs text-zinc-300 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{localSettings.workingHours || 'Mon - Fri: 9AM - 6PM'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: General Store Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-display text-xl mb-6">GENERAL STORE CONFIGURATION</h2>
                  
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Store Name</label>
                      <input
                        type="text"
                        value={localSettings.storeName}
                        onChange={(e) => setLocalSettings({ ...localSettings, storeName: e.target.value })}
                        className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Currency</label>
                        <select
                          value={localSettings.currency}
                          onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="LKR">LKR (Rs.)</option>
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
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Asia/Colombo">Sri Lanka (Colombo)</option>
                          <option value="America/New_York">Eastern Time (US)</option>
                          <option value="America/Los_Angeles">Pacific Time (US)</option>
                          <option value="Europe/London">London (UK)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Notifications */}
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
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">This email receives low stock and daily sales digests</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={localSettings.lowStockThreshold || 10}
                          onChange={(e) => setLocalSettings({ ...localSettings, lowStockThreshold: parseInt(e.target.value) || 10 })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Products below this count trigger warnings</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendTestEmail}
                        disabled={isSendingTestEmail}
                        className="gap-2"
                      >
                        {isSendingTestEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Send Test Notification Email
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Security */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-display text-xl mb-6">SECURITY SETTINGS</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div>
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security to your admin account</p>
                      </div>
                      <button
                        onClick={() => setLocalSettings({ ...localSettings, twoFactorAuth: !localSettings.twoFactorAuth })}
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
                        className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Payments */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-display text-xl">PAYMENT METHODS</h2>
                    <Button onClick={() => setIsAddingPayment(true)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Method
                    </Button>
                  </div>

                  {/* Add Payment Method Modal */}
                  {isAddingPayment && (
                    <div className="p-4 bg-secondary rounded-lg space-y-4">
                      <h3 className="font-medium">Add Payment Method</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Method Name"
                          value={newPaymentMethod.name}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                          className="h-10 px-3 bg-background border border-border rounded-lg text-sm"
                        />
                        <select
                          value={newPaymentMethod.type}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value as any })}
                          className="h-10 px-3 bg-background border border-border rounded-lg text-sm"
                        >
                          <option value="card">Credit/Debit Card</option>
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash_on_delivery">Cash on Delivery</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder="Description"
                        value={newPaymentMethod.description}
                        onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, description: e.target.value })}
                        className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleAddPaymentMethod} size="sm">Add</Button>
                        <Button variant="outline" onClick={() => setIsAddingPayment(false)} size="sm">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {/* List of Payment Methods */}
                  <div className="space-y-3">
                    {settings.paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{method.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              method.enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              {method.enabled ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{method.description}</p>
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
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Changes made here automatically reflect across the entire store.
                </span>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || isApiLoading}
                  className="gap-2 font-bold uppercase tracking-wider"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save All Changes
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