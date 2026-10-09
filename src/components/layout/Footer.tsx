import { Link } from 'react-router-dom';
import { Instagram, Twitter, Youtube, Mail, ArrowUpRight, MapPin, Phone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/common/BrandLogo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Fuel Your Ascent. Premium supplements for peak performance and optimal recovery.
            </p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, label: 'Instagram', href: '#' },
                { icon: Twitter, label: 'Twitter', href: '#' },
                { icon: Youtube, label: 'Youtube', href: '#' },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
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

          {/* Contact Info */}
          <div className="space-y-5">
            <h4 className="text-display text-lg tracking-wider text-foreground">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">123 Fitness Street, Gym City, GC 12345</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">support@beastfuel.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">Mon - Fri: 9AM - 6PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-display text-lg tracking-wider text-foreground mb-2">Subscribe to Newsletter</h4>
              <p className="text-sm text-muted-foreground">Get 10% off your first order and stay updated.</p>
            </div>
            <div className="flex w-full md:w-auto max-w-md gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-11 px-4 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <Button className="h-11 px-6">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} BEASTFUEL Supplements. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { name: 'Privacy Policy', path: '/privacy' },
              { name: 'Terms of Service', path: '/terms' },
              { name: 'Cookies', path: '/cookies' },
            ].map((item) => (
              <Link 
                key={item.name}
                to={item.path}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;