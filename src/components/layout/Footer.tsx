import { Link } from 'react-router-dom';
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  Mail, 
  ArrowUpRight, 
  MapPin, 
  Phone, 
  Clock, 
  Globe, 
  MessageCircle, 
  Video, 
  Linkedin, 
  Send, 
  Gamepad2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useSettings } from '@/hooks/useSettings';

const getPlatformIcon = (platform: string = '') => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return Instagram;
    case 'twitter':
    case 'x':
      return Twitter;
    case 'youtube':
      return Youtube;
    case 'facebook':
      return Facebook;
    case 'whatsapp':
      return MessageCircle;
    case 'tiktok':
      return Video;
    case 'linkedin':
      return Linkedin;
    case 'telegram':
      return Send;
    case 'discord':
      return Gamepad2;
    case 'website':
    default:
      return Globe;
  }
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSettings();

  // Dynamic active social & website links list: filter out disabled or empty URLs
  const activeSocialAccounts = (
    Array.isArray(settings.socialMediaAccounts) && settings.socialMediaAccounts.length > 0
      ? settings.socialMediaAccounts
      : [
          { id: '1', platform: 'instagram', label: 'Instagram', url: settings.socialLinks?.instagram, enabled: true },
          { id: '2', platform: 'twitter', label: 'Twitter', url: settings.socialLinks?.twitter, enabled: true },
          { id: '3', platform: 'youtube', label: 'Youtube', url: settings.socialLinks?.youtube, enabled: true },
          { id: '4', platform: 'facebook', label: 'Facebook', url: settings.socialLinks?.facebook, enabled: true },
        ]
  ).filter((acc) => Boolean(acc && acc.enabled && acc.url && acc.url.trim() !== '' && acc.url !== '#'));

  return (
    <footer className="relative bg-card border-t border-border overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      
      <div className="relative container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" className="inline-flex items-center">
              <BrandLogo className="h-10 w-auto" />
            </Link>
            {settings.tagline?.trim() && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {settings.tagline}
              </p>
            )}

            {/* Dynamic Social Icons: auto-adjusts spacing, disappears when removed */}
            {activeSocialAccounts.length > 0 && (
              <div className="flex flex-wrap gap-2.5 items-center">
                {activeSocialAccounts.map((account) => {
                  const Icon = getPlatformIcon(account.platform);
                  return (
                    <motion.a
                      key={account.id || account.label}
                      href={account.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 shadow-sm"
                      aria-label={account.label || account.platform}
                      title={account.label || account.platform}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h4 className="text-display text-lg tracking-wider text-foreground">Shop</h4>
            <ul className="space-y-3">
              {[
                { name: 'All Products', path: '/products' },
                { name: 'Protein', path: '/products?category=protein' },
                { name: 'Pre-Workout', path: '/products?category=pre-workout' },
                { name: 'Performance', path: '/products?category=performance' },
                { name: 'Recovery', path: '/products?category=recovery' },
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.path}
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-5">
            <h4 className="text-display text-lg tracking-wider text-foreground">Support</h4>
            <ul className="space-y-3">
              {[
                { name: 'FAQ', path: '/faq' },
                { name: 'My Account', path: '/dashboard' },
                { name: 'My Cart', path: '/cart' },
                { name: 'Contact', path: '/contact' },
              ].map((item) => (
                <li key={item.name}>
                  <Link 
                    to={item.path}
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Contact Info: hides cleared items and auto-adjusts layout */}
          <div className="space-y-5">
            <h4 className="text-display text-lg tracking-wider text-foreground">Contact</h4>
            <ul className="space-y-4">
              {settings.storeAddress?.trim() && (
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {settings.storeAddress}
                  </span>
                </li>
              )}
              {settings.storePhone?.trim() && (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={`tel:${settings.storePhone.replace(/[^0-9+]/g, '')}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.storePhone}
                  </a>
                </li>
              )}
              {settings.storeEmail?.trim() && (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={`mailto:${settings.storeEmail}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.storeEmail}
                  </a>
                </li>
              )}
              {settings.workingHours?.trim() && (
                <li className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {settings.workingHours}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {currentYear} {settings.storeName || 'BEASTFUEL Supplements'}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
