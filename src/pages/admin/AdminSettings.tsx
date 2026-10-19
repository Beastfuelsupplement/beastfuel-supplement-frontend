import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Video,
  Globe,
  Linkedin,
  Send,
  Gamepad2,
  Eye,
  EyeOff,
  Link2,
  Truck
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAdminStore, PaymentMethod } from '@/store/adminStore';
import { checkAndNotifyLowStock } from '@/utils/stockNotification';
import { useSettings, SocialMediaAccount } from '@/hooks/useSettings';
import { 
  SUPPORTED_CURRENCIES, 
  COUNTRY_DEFAULTS, 
  TIMEZONE_OPTIONS,
  formatCurrency
} from '@/lib/currency';

const AVAILABLE_PLATFORMS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'discord', label: 'Discord' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'website', label: 'Website / Custom Link' },
];

const getPlatformIcon = (platform: string = '') => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return { icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20', defaultLabel: 'Instagram' };
    case 'twitter':
    case 'x':
      return { icon: Twitter, color: 'text-sky-400', bg: 'bg-sky-400/10 border-sky-400/20', defaultLabel: 'Twitter / X' };
    case 'youtube':
      return { icon: Youtube, color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', defaultLabel: 'YouTube' };
    case 'facebook':
      return { icon: Facebook, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', defaultLabel: 'Facebook' };
    case 'whatsapp':
      return { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', defaultLabel: 'WhatsApp' };
    case 'tiktok':
      return { icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20', defaultLabel: 'TikTok' };
    case 'linkedin':
      return { icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', defaultLabel: 'LinkedIn' };
    case 'telegram':
      return { icon: Send, color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20', defaultLabel: 'Telegram' };
    case 'discord':
      return { icon: Gamepad2, color: 'text-indigo-400', bg: 'bg-indigo-400/10 border-indigo-400/20', defaultLabel: 'Discord' };
    case 'website':
    default:
      return { icon: Globe, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', defaultLabel: 'Website Link' };
  }
};

const AdminSettings = () => {
  const { settings, updateSettings, addPaymentMethod, updatePaymentMethod, deletePaymentMethod, products } = useAdminStore();
  const { settings: apiSettings, updateSettings: updateApiSettings, loading: isApiLoading } = useSettings();

  const [activeTab, setActiveTab] = useState('contact_social');
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    ...settings,
    country: apiSettings.country || (settings as any).country || 'Sri Lanka',
    tagline: apiSettings.tagline || settings.tagline || 'Fuel Your Ascent. Premium supplements for peak performance and optimal recovery.',
    workingHours: apiSettings.workingHours || settings.workingHours || 'Mon - Fri: 9AM - 6PM',
    weekendHours: apiSettings.weekendHours || settings.weekendHours || 'Sat - Sun: Closed',
    contactSubtext: apiSettings.contactSubtext || settings.contactSubtext || 'We reply within 24 hours',
    shippingType: apiSettings.shippingType || (settings as any).shippingType || 'free',
    shippingCost: apiSettings.shippingCost !== undefined ? apiSettings.shippingCost : ((settings as any).shippingCost ?? 0),
    enableFreeShippingThreshold: apiSettings.enableFreeShippingThreshold !== undefined ? apiSettings.enableFreeShippingThreshold : Boolean((settings as any).enableFreeShippingThreshold),
    freeShippingThreshold: apiSettings.freeShippingThreshold !== undefined ? apiSettings.freeShippingThreshold : ((settings as any).freeShippingThreshold ?? 50),
    shippingEstimatedDays: apiSettings.shippingEstimatedDays || (settings as any).shippingEstimatedDays || '1-3 Business Days',
  });

  // Dynamic social media accounts list
  const [socialAccounts, setSocialAccounts] = useState<SocialMediaAccount[]>(() => {
    if (apiSettings.socialMediaAccounts && apiSettings.socialMediaAccounts.length > 0) {
      return apiSettings.socialMediaAccounts;
    }
    return [
      { id: 'soc-1', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/beastfuel', enabled: true },
      { id: 'soc-2', platform: 'twitter', label: 'Twitter / X', url: 'https://twitter.com/beastfuel', enabled: true },
      { id: 'soc-3', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com/@beastfuel', enabled: true },
      { id: 'soc-4', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/beastfuel', enabled: true },
    ];
  });

  // New account form state
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState('website');
  const [newSocialLabel, setNewSocialLabel] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Sync when API settings load or change
  useEffect(() => {
    if (apiSettings) {
      setLocalSettings((prev) => ({
        ...prev,
        country: apiSettings.country || prev.country || 'Sri Lanka',
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
        shippingType: apiSettings.shippingType || prev.shippingType || 'free',
        shippingCost: apiSettings.shippingCost !== undefined ? apiSettings.shippingCost : prev.shippingCost,
        enableFreeShippingThreshold: apiSettings.enableFreeShippingThreshold !== undefined ? apiSettings.enableFreeShippingThreshold : prev.enableFreeShippingThreshold,
        freeShippingThreshold: apiSettings.freeShippingThreshold !== undefined ? apiSettings.freeShippingThreshold : prev.freeShippingThreshold,
        shippingEstimatedDays: apiSettings.shippingEstimatedDays || prev.shippingEstimatedDays || '1-3 Business Days',
      }));

      if (Array.isArray(apiSettings.socialMediaAccounts) && apiSettings.socialMediaAccounts.length > 0) {
        setSocialAccounts(apiSettings.socialMediaAccounts);
      }
    }
  }, [apiSettings]);

  // Country change: Automatically configure corresponding Currency & Timezone
  const handleCountryChange = (newCountry: string) => {
    const defaults = COUNTRY_DEFAULTS[newCountry];
    setLocalSettings((prev) => ({
      ...prev,
      country: newCountry,
      currency: defaults ? defaults.currency : prev.currency,
      timezone: defaults ? defaults.timezone : prev.timezone,
    }));
    if (defaults) {
      toast.info(`Updated to ${newCountry} (Currency: ${defaults.currency}, Timezone: ${defaults.timezone})`);
    }
  };

  // Currency change: Automatically set default matching Timezone
  const handleCurrencyChange = (newCurrency: string) => {
    const config = SUPPORTED_CURRENCIES[newCurrency];
    setLocalSettings((prev) => ({
      ...prev,
      currency: newCurrency,
      timezone: config?.defaultTimezone || prev.timezone,
    }));
    if (config?.defaultTimezone) {
      toast.info(`Switched currency to ${newCurrency} (${config.symbol}) — Timezone set to ${config.defaultTimezone}`);
    }
  };

  // Social account handlers
  const handleAddNewSocialAccount = () => {
    if (!newSocialUrl.trim()) {
      toast.error('Please enter a valid URL for the new link');
      return;
    }

    const platformMeta = getPlatformIcon(newSocialPlatform);
    const newAcc: SocialMediaAccount = {
      id: `soc-${Date.now()}`,
      platform: newSocialPlatform,
      label: newSocialLabel.trim() || platformMeta.defaultLabel,
      url: newSocialUrl.trim(),
      enabled: true,
    };

    setSocialAccounts((prev) => [...prev, newAcc]);
    setNewSocialUrl('');
    setNewSocialLabel('');
    setIsAddingSocial(false);
    toast.success(`Added ${newAcc.label}! Click "Save All Changes" to publish.`);
  };

  const handleUpdateSocialAccount = (id: string, updates: Partial<SocialMediaAccount>) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const handleDeleteSocialAccount = (id: string, label: string) => {
    setSocialAccounts((prev) => prev.filter((acc) => acc.id !== id));
    toast.info(`Removed ${label || 'account'}. Click "Save All Changes" to apply.`);
  };

  const handleToggleSocialAccount = (id: string) => {
    setSocialAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, enabled: !acc.enabled } : acc))
    );
  };

  // Payment methods state
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
        country: localSettings.country,
        storeEmail: localSettings.storeEmail,
        storePhone: localSettings.storePhone,
        storeAddress: localSettings.storeAddress,
        workingHours: localSettings.workingHours,
        weekendHours: localSettings.weekendHours,
        contactSubtext: localSettings.contactSubtext,
        socialMediaAccounts: socialAccounts,
        currency: localSettings.currency,
        timezone: localSettings.timezone,
        adminEmail: localSettings.adminEmail,
        lowStockThreshold: localSettings.lowStockThreshold,
        shippingType: localSettings.shippingType,
        shippingCost: localSettings.shippingCost,
        enableFreeShippingThreshold: localSettings.enableFreeShippingThreshold,
        freeShippingThreshold: localSettings.freeShippingThreshold,
        shippingEstimatedDays: localSettings.shippingEstimatedDays,
      });

      // 2. Update local state store and instant currency cache
      updateSettings({
        ...localSettings,
      });

      try {
        localStorage.setItem('beastfuel_currency', localSettings.currency);
        window.dispatchEvent(
          new CustomEvent('settings:updated', {
            detail: {
              currency: localSettings.currency,
              timezone: localSettings.timezone,
              country: localSettings.country,
            },
          })
        );
        window.dispatchEvent(new Event('storage'));
      } catch {
        // storage fallback
      }

      if (success) {
        toast.success(`Settings saved! Currency updated to ${localSettings.currency} across all pages and emails.`);
      } else {
        toast.success(`Settings saved to browser storage! Currency set to ${localSettings.currency}.`);
      }
    } catch (err: any) {
      toast.error('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
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
    { id: 'contact_social', label: 'Contact & Social Links', icon: Share2 },
    { id: 'general', label: 'General Store', icon: Store },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  // Active accounts for live preview
  const livePreviewAccounts = socialAccounts.filter(
    (acc) => Boolean(acc.enabled && acc.url && acc.url.trim() !== '')
  );

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
            <nav className="flex lg:flex-col overflow-x-auto gap-1.5 p-1.5 sm:p-2 bg-card border border-border rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg text-left transition-colors font-medium text-xs sm:text-sm whitespace-nowrap shrink-0 lg:w-full ${
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
            <div className="hidden lg:block mt-4 p-4 rounded-xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground space-y-2">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-primary" /> Dynamic Real-Time Sync
              </div>
              <p>
                Add or remove any social media or website link. When removed or disabled, the icon automatically vanishes from the footer and the remaining icons adjust their spacing smoothly.
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
              className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm space-y-6"
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
                        These details appear in the Website Footer and Contact page. If any field is cleared, that line will automatically disappear and collapse the space.
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
                            placeholder="supportbeastfuelsupplement@gmail.com"
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

                  {/* Section 2: Dynamic Social Media & Website Accounts */}
                  <div className="space-y-4 pt-4 border-t border-border/80">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/80 pb-3">
                      <div>
                        <h2 className="text-display text-xl flex items-center gap-2">
                          <Share2 className="w-5 h-5 text-primary" />
                          SOCIAL MEDIA ACCOUNTS & WEBSITE LINKS
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Add new accounts, change links, or remove existing accounts. Spacing in the website footer will automatically adjust.
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsAddingSocial(!isAddingSocial)}
                        className="gap-1.5 shrink-0 uppercase tracking-wider font-bold text-xs"
                      >
                        <Plus className="w-4 h-4" />
                        Add New Link
                      </Button>
                    </div>

                    {/* Add Account Inline Form */}
                    <AnimatePresence>
                      {isAddingSocial && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 rounded-xl bg-secondary/80 border border-primary/40 space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add New Social Media Account or Website
                              </h3>
                              <button
                                type="button"
                                onClick={() => setIsAddingSocial(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                                  Platform Type
                                </label>
                                <select
                                  value={newSocialPlatform}
                                  onChange={(e) => {
                                    setNewSocialPlatform(e.target.value);
                                    const meta = getPlatformIcon(e.target.value);
                                    if (!newSocialLabel) setNewSocialLabel(meta.defaultLabel);
                                  }}
                                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  {AVAILABLE_PLATFORMS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                                  Account Label / Name
                                </label>
                                <input
                                  type="text"
                                  value={newSocialLabel}
                                  onChange={(e) => setNewSocialLabel(e.target.value)}
                                  placeholder={getPlatformIcon(newSocialPlatform).defaultLabel}
                                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">
                                  Target Web URL
                                </label>
                                <input
                                  type="url"
                                  value={newSocialUrl}
                                  onChange={(e) => setNewSocialUrl(e.target.value)}
                                  placeholder="https://..."
                                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsAddingSocial(false)}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAddNewSocialAccount}
                                className="text-xs font-bold uppercase tracking-wider"
                              >
                                Add Account
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Social Accounts List */}
                    <div className="space-y-3">
                      {socialAccounts.length === 0 ? (
                        <div className="p-8 text-center rounded-xl bg-secondary/30 border border-dashed border-border/80 text-muted-foreground">
                          <p className="text-sm">No social media links or websites configured yet.</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingSocial(true)}
                            className="mt-3 gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Your First Link
                          </Button>
                        </div>
                      ) : (
                        socialAccounts.map((account) => {
                          const meta = getPlatformIcon(account.platform);
                          const Icon = meta.icon;

                          return (
                            <div
                              key={account.id}
                              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                account.enabled
                                  ? 'bg-secondary/40 border-border hover:border-primary/40'
                                  : 'bg-muted/30 border-dashed border-border/60 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Platform Icon Badge */}
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${meta.bg}`}>
                                  <Icon className={`w-5 h-5 ${meta.color}`} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0">
                                  {/* Platform Selector & Label */}
                                  <div className="flex gap-2">
                                    <select
                                      value={account.platform}
                                      onChange={(e) =>
                                        handleUpdateSocialAccount(account.id, {
                                          platform: e.target.value,
                                          label: account.label || getPlatformIcon(e.target.value).defaultLabel,
                                        })
                                      }
                                      className="h-9 px-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
                                    >
                                      {AVAILABLE_PLATFORMS.map((p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.label}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      value={account.label}
                                      onChange={(e) =>
                                        handleUpdateSocialAccount(account.id, { label: e.target.value })
                                      }
                                      placeholder="Account Label"
                                      className="h-9 px-2.5 bg-background border border-border rounded-lg text-xs text-foreground flex-1 min-w-0 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                  </div>

                                  {/* URL Input */}
                                  <div className="relative">
                                    <input
                                      type="url"
                                      value={account.url}
                                      onChange={(e) =>
                                        handleUpdateSocialAccount(account.id, { url: e.target.value })
                                      }
                                      placeholder="https://..."
                                      className="w-full h-9 pl-3 pr-8 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    {account.url && (
                                      <a
                                        href={account.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Test this link"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons: Toggle Active & Delete */}
                              <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleSocialAccount(account.id)}
                                  className={`h-9 px-2.5 text-xs gap-1.5 ${
                                    account.enabled
                                      ? 'text-emerald-500 hover:text-emerald-400 bg-emerald-500/10'
                                      : 'text-muted-foreground hover:text-foreground bg-muted'
                                  }`}
                                  title={account.enabled ? 'Click to Disable from website' : 'Click to Enable on website'}
                                >
                                  {account.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                  <span>{account.enabled ? 'Active' : 'Hidden'}</span>
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSocialAccount(account.id, account.label)}
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Section 3: Live Preview of Website Footer Area */}
                  <div className="pt-4 border-t border-border/80">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                      <span>Live Footer Preview (Auto-adjusts instantly as accounts are added/removed)</span>
                      <span className="text-[11px] font-normal text-primary">
                        {livePreviewAccounts.length} {livePreviewAccounts.length === 1 ? 'icon' : 'icons'} visible
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-white space-y-4">
                      <div className="grid sm:grid-cols-2 gap-6">
                        {/* Brand & Dynamic Social Preview */}
                        <div className="space-y-3">
                          <div className="text-lg font-black tracking-wider text-white">BEASTFUEL</div>
                          {localSettings.tagline && (
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {localSettings.tagline}
                            </p>
                          )}

                          {/* Dynamic Icons Preview with auto-spacing */}
                          {livePreviewAccounts.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {livePreviewAccounts.map((account) => {
                                const meta = getPlatformIcon(account.platform);
                                const Icon = meta.icon;
                                return (
                                  <div
                                    key={account.id}
                                    title={account.label || account.platform}
                                    className="w-8 h-8 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center transition-all hover:scale-105 shadow-sm"
                                  >
                                    <Icon className={`w-4 h-4 ${meta.color}`} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-500 italic pt-1">
                              No social accounts visible in footer
                            </div>
                          )}
                        </div>

                        {/* Contact Block Preview (Auto-collapses empty items) */}
                        <div className="space-y-2.5">
                          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">CONTACT</div>
                          {localSettings.storeAddress?.trim() && (
                            <div className="text-xs text-zinc-300 flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{localSettings.storeAddress}</span>
                            </div>
                          )}
                          {localSettings.storePhone?.trim() && (
                            <div className="text-xs text-zinc-300 flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{localSettings.storePhone}</span>
                            </div>
                          )}
                          {localSettings.storeEmail?.trim() && (
                            <div className="text-xs text-zinc-300 flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{localSettings.storeEmail}</span>
                            </div>
                          )}
                          {localSettings.workingHours?.trim() && (
                            <div className="text-xs text-zinc-300 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{localSettings.workingHours}</span>
                            </div>
                          )}
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

                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Country Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Country / Region</label>
                        <select
                          value={localSettings.country || 'Sri Lanka'}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                          {Object.keys(COUNTRY_DEFAULTS).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Auto-sets default currency & timezone
                        </p>
                      </div>

                      {/* Currency Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Currency</label>
                        <select
                          value={localSettings.currency}
                          onChange={(e) => handleCurrencyChange(e.target.value)}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                          {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.code} ({curr.symbol}) - {curr.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Replaces Rs. with {SUPPORTED_CURRENCIES[localSettings.currency]?.symbol || localSettings.currency} on all pages & emails
                        </p>
                      </div>

                      {/* Timezone Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Timezone</label>
                        <select
                          value={localSettings.timezone}
                          onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                          className="w-full h-12 px-4 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <option key={tz.value} value={tz.value}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Used for orders, timestamps & daily email alerts
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: Shipping & Delivery Settings */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div className="border-b border-border/80 pb-3">
                    <h2 className="text-display text-xl flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      SHIPPING & DELIVERY CONFIGURATION
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure delivery costs, flat fees, free shipping rules, and delivery timelines for Cart & Checkout.
                    </p>
                  </div>

                  {/* Mode selector: Free vs Flat Rate */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground">
                      Delivery Pricing Method
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Free Shipping Option */}
                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          localSettings.shippingType === 'free'
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                            : 'bg-card border-border hover:border-muted-foreground/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingType"
                          value="free"
                          checked={localSettings.shippingType === 'free'}
                          onChange={() => setLocalSettings({ ...localSettings, shippingType: 'free' })}
                          className="mt-1 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">100% Free Shipping</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              ✓ FREE
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            All orders receive complimentary free delivery across the store regardless of order amount.
                          </p>
                        </div>
                      </label>

                      {/* Custom Flat Rate Shipping Option */}
                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          localSettings.shippingType === 'flat_rate'
                            ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-sm'
                            : 'bg-card border-border hover:border-muted-foreground/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shippingType"
                          value="flat_rate"
                          checked={localSettings.shippingType === 'flat_rate'}
                          onChange={() => setLocalSettings({ ...localSettings, shippingType: 'flat_rate' })}
                          className="mt-1 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">Custom Delivery Fee</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                              Fixed Fee
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Charge a fixed shipping cost on orders, with optional free delivery for orders above a threshold.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Settings when Flat Rate is selected */}
                  {localSettings.shippingType === 'flat_rate' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl bg-secondary/30 border border-border/80 space-y-5"
                    >
                      {/* Fixed Shipping Fee Input */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                          Standard Shipping Fee ({localSettings.currency}) <span className="text-destructive">*</span>
                        </label>
                        <div className="relative max-w-xs">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={localSettings.shippingCost}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                shippingCost: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            placeholder="e.g. 500 or 9.99"
                            className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          This fee is automatically added to the cart subtotal when customers proceed to checkout.
                        </p>
                      </div>

                      {/* Free Shipping Over Threshold Toggle */}
                      <div className="p-4 bg-background/80 rounded-xl border border-border/80 space-y-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localSettings.enableFreeShippingThreshold}
                            onChange={(e) =>
                              setLocalSettings({
                                ...localSettings,
                                enableFreeShippingThreshold: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <div>
                            <span className="text-xs font-bold text-foreground block">
                              Offer Free Delivery for Orders Exceeding a Specific Amount
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Encourages customers to add more supplements to reach free shipping.
                            </span>
                          </div>
                        </label>

                        {localSettings.enableFreeShippingThreshold && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-2 pl-6"
                          >
                            <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                              Minimum Order Subtotal for Free Shipping ({localSettings.currency})
                            </label>
                            <div className="relative max-w-xs">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={localSettings.freeShippingThreshold}
                                onChange={(e) =>
                                  setLocalSettings({
                                    ...localSettings,
                                    freeShippingThreshold: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                placeholder="e.g. 15000 or 50"
                                className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              When a customer's cart subtotal reaches this amount, shipping automatically becomes FREE.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Delivery Timeline / Note */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                      Estimated Delivery Timeline Note
                    </label>
                    <input
                      type="text"
                      value={localSettings.shippingEstimatedDays || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, shippingEstimatedDays: e.target.value })}
                      placeholder="e.g. 1-3 Business Days Island-wide"
                      className="w-full h-11 px-3.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Shown across product pages and checkout to reassure customers.
                    </p>
                  </div>

                  {/* Live Order Summary Customer Preview Card */}
                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/80 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-primary" /> Customer Cart Order Summary Live Preview
                    </span>
                    <div className="max-w-sm p-4 rounded-xl bg-card border border-border shadow-xs space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(localSettings.shippingType === 'flat_rate' && localSettings.enableFreeShippingThreshold ? (localSettings.freeShippingThreshold || 100) * 0.8 : 50)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className={`font-bold ${localSettings.shippingType === 'free' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                          {localSettings.shippingType === 'free' ? '✓ FREE' : formatCurrency(localSettings.shippingCost)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-bold">
                        <span>Total</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(
                            (localSettings.shippingType === 'flat_rate' && localSettings.enableFreeShippingThreshold ? (localSettings.freeShippingThreshold || 100) * 0.8 : 50) +
                            (localSettings.shippingType === 'free' ? 0 : localSettings.shippingCost)
                          )}
                        </span>
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

              {/* Bottom Helper Note */}
              <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  All changes are synced live to the database and reflect across the website immediately upon saving.
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;