import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Home, Package, Info, Flame, Award, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useProducts } from '@/hooks/useProducts';
import { useBrands } from '@/hooks/useBrands';
import { formatImageUrl } from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated, user, isAdmin } = useAuth();
  const location = useLocation();

  // Brands data for quick navigation
  const { data: brands = [] } = useBrands();

  // Check if any products have an active offer
  const { data: apiProducts = [] } = useProducts(true);
  const storeProducts = useAdminStore((state) => state.products);
  const allProducts = apiProducts.length > 0 ? apiProducts : storeProducts;
  const hasOffers = allProducts.some((p) => {
    const isExpired = Boolean(p.offerEndDate && new Date(p.offerEndDate).getTime() < Date.now());
    return !isExpired && Boolean(
      p.hasOffer ||
      (p.offerDiscount !== undefined && Number(p.offerDiscount) > 0) ||
      (p.offerDiscountAmount !== undefined && Number(p.offerDiscountAmount) > 0)
    );
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: Package },
    { href: '/brands', label: 'Brands', icon: Award },
    ...(hasOffers ? [{ 
      href: '/offers', 
      label: 'Offers', 
      icon: Flame, 
      isOffer: true 
    }] : []),
    { href: '/about', label: 'About', icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      {/* Main Nav Container - always dark in both light and dark theme */}
      <div 
        className={`transition-all duration-300 bg-zinc-950 text-white ${
          isScrolled 
            ? 'border-b border-zinc-800/80 shadow-xl py-2.5 sm:py-3' 
            : 'border-b border-zinc-800/40 py-3 sm:py-3.5'
        }`}
      >
        <nav className="container mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.02 }}
            >
              <BrandLogo variant="light" className="h-10 sm:h-11 md:h-12 w-auto" />
            </motion.div>
          </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Link
                to={link.href}
                className={`relative px-4 py-2.5 text-sm font-semibold uppercase tracking-[0.15em] transition-colors group flex items-center gap-1.5 ${
                  isActive(link.href) 
                    ? 'text-white font-bold' 
                    : (link as any).isOffer
                    ? 'text-rose-400 hover:text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {(link as any).isOffer && (
                  <Flame className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                )}
                {link.label}
                {(link as any).isOffer && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-600 text-white tracking-wider animate-bounce">
                    HOT
                  </span>
                )}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300 ${
                  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="text-zinc-300 hover:text-white hover:bg-zinc-800/80" />
          
          <Link to="/cart" className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative group text-zinc-300 hover:text-white hover:bg-zinc-800/80"
            >
              <ShoppingCart className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-lg"
                >
                  {totalItems}
                </motion.span>
              )}
            </Button>
          </Link>
          
          <Link to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login'} className="hidden md:block">
            <Button 
              size="sm" 
              className="gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700/80 shadow-sm font-semibold transition-all"
            >
              <User className="h-4 w-4" />
              {isAuthenticated ? (isAdmin ? 'Admin' : user?.name?.split(' ')[0]) : 'Login'}
            </Button>
          </Link>

          {/* Animated Hamburger Button */}
          <button
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-800/80 transition-colors focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <motion.span
                className="block h-0.5 w-6 bg-white rounded-full origin-left"
                animate={isMenuOpen ? { rotate: 45, x: 1, y: -1 } : { rotate: 0, x: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
              <motion.span
                className="block h-0.5 w-6 bg-white rounded-full"
                animate={isMenuOpen ? { opacity: 0, x: -16 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-0.5 w-6 bg-white rounded-full origin-left"
                animate={isMenuOpen ? { rotate: -45, x: 1, y: 1 } : { rotate: 0, x: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </button>
        </div>
      </nav>
    </div>

    {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 top-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] sm:w-[320px] z-50 md:hidden bg-zinc-950 text-white border-l border-zinc-800 shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800/80 transition-colors"
                  aria-label="Close menu"
                >
                  <div className="w-4 h-4 relative">
                    <span className="absolute top-1/2 left-0 w-full h-0.5 bg-white rounded-full rotate-45 -translate-y-1/2" />
                    <span className="absolute top-1/2 left-0 w-full h-0.5 bg-white rounded-full -rotate-45 -translate-y-1/2" />
                  </div>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 flex flex-col gap-1.5 flex-1 overflow-y-auto">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * index, duration: 0.4 }}
                  >
                    <Link
                      to={link.href}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
                        isActive(link.href)
                          ? 'bg-primary/15 text-primary border border-primary/30 font-bold'
                          : (link as any).isOffer
                          ? 'text-rose-400 hover:text-white hover:bg-rose-500/10'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <link.icon className={`h-5 w-5 ${isActive(link.href) ? 'text-primary' : (link as any).isOffer ? 'text-rose-500' : ''}`} />
                      {link.label}
                      {(link as any).isOffer && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-600 text-white tracking-wider">
                          HOT
                        </span>
                      )}
                      {isActive(link.href) && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-2 h-2 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-zinc-800/80" />

              {/* Account Button */}
              <div className="p-4">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Link 
                    to={isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/login'} 
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="hero" size="lg" className="w-full font-bold">
                      <User className="h-4 w-4 mr-2" />
                      {isAuthenticated ? (isAdmin ? 'Admin Panel' : 'My Account') : 'Login'}
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Footer Branding */}
              <div className="p-5 border-t border-zinc-800/60 flex items-center justify-center">
                <BrandLogo variant="light" className="h-7 w-auto opacity-75" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;