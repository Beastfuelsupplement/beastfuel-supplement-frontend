import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Home, Package, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { isAuthenticated, user, isAdmin } = useAuth();
  const location = useLocation();

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
    { href: '/about', label: 'About', icon: Info },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'glass-dark py-3' 
          : 'bg-transparent py-4'
      }`}
    >
      <nav className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <motion.div 
            className="flex items-center gap-2.5 sm:gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <img 
              src="/beastfuel-logo.png" 
              alt="BEASTFUEL Supplements" 
              className="h-9 sm:h-10 w-9 sm:w-10 rounded-lg object-contain bg-black border border-border/40 shadow-sm"
            />
            <div className="flex flex-col items-start leading-none">
              <span className="text-display text-2xl sm:text-3xl md:text-4xl tracking-[0.16em] font-black text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                BEASTFUEL
              </span>
              <span className="text-[0.5rem] sm:text-[0.55rem] md:text-[0.6rem] tracking-[0.35em] uppercase text-muted-foreground font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>
                Supplements
              </span>
            </div>
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
                className={`relative px-5 py-2.5 text-sm font-medium uppercase tracking-[0.15em] transition-colors group ${
                  isActive(link.href) ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-primary transition-all duration-300 ${
                  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="relative group">
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
            <Button variant="glass" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              {isAuthenticated ? (isAdmin ? 'Admin' : user?.name?.split(' ')[0]) : 'Login'}
            </Button>
          </Link>

          {/* Animated Hamburger Button */}
          <button
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between">
              <motion.span
                className="block h-0.5 w-6 bg-foreground rounded-full origin-left"
                animate={isMenuOpen ? { rotate: 45, x: 1, y: -1 } : { rotate: 0, x: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
              <motion.span
                className="block h-0.5 w-6 bg-foreground rounded-full"
                animate={isMenuOpen ? { opacity: 0, x: -16 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              />
              <motion.span
                className="block h-0.5 w-6 bg-foreground rounded-full origin-left"
                animate={isMenuOpen ? { rotate: -45, x: 1, y: 1 } : { rotate: 0, x: 0, y: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </button>
        </div>
      </nav>

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
              className="fixed inset-0 top-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-50 md:hidden bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-border/30">
                <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-semibold">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent/50 transition-colors"
                  aria-label="Close menu"
                >
                  <div className="w-4 h-4 relative">
                    <span className="absolute top-1/2 left-0 w-full h-0.5 bg-foreground rounded-full rotate-45 -translate-y-1/2" />
                    <span className="absolute top-1/2 left-0 w-full h-0.5 bg-foreground rounded-full -rotate-45 -translate-y-1/2" />
                  </div>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 flex flex-col gap-1">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * index, duration: 0.4 }}
                  >
                    <Link
                      to={link.href}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium uppercase tracking-wider transition-all duration-200 ${
                        isActive(link.href)
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <link.icon className={`h-5 w-5 ${isActive(link.href) ? 'text-primary' : ''}`} />
                      {link.label}
                      {isActive(link.href) && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                        />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-border/30" />

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
                    <Button variant="hero" size="lg" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      {isAuthenticated ? (isAdmin ? 'Admin Panel' : 'My Account') : 'Login'}
                    </Button>
                  </Link>
                </motion.div>
              </div>

              {/* Footer Branding */}
              <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border/20">
                <div className="flex items-center justify-center gap-2.5">
                  <img 
                    src="/beastfuel-logo.png" 
                    alt="BEASTFUEL" 
                    className="h-7 w-7 rounded-md object-contain bg-black border border-border/30 opacity-70"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-lg tracking-[0.18em] font-black text-muted-foreground/70" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      BEASTFUEL
                    </span>
                    <span className="text-[0.5rem] tracking-[0.35em] uppercase text-muted-foreground/40">
                      Supplements
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;