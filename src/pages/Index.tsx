import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Truck, Shield, Award, Zap, ChevronDown, Star, Quote, Dumbbell, Flame, Leaf, HeartPulse, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatImageUrl } from '@/lib/api';
import heroBg from '@/assets/hero-bg.jpg';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useCurrency, formatCurrency, FREE_SHIPPING_THRESHOLD } from '@/lib/currency';


const Index = () => {
  const { data: products = [] } = useProducts();
  const { data: categoriesData = [] } = useCategories();
  const featuredProducts = products.slice(0, 4);

  // Take all active categories for the horizontal slider
  const displayCategories = useMemo(() => {
    const featured = categoriesData.filter((c) => c.featured !== false);
    return featured.length > 0 ? featured : categoriesData;
  }, [categoriesData]);

  // Category horizontal scroll & pagination state
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeDotIndex, setActiveDotIndex] = useState(0);

  // Total dots based on category count
  const totalDots = useMemo(() => {
    if (displayCategories.length <= 1) return 1;
    return Math.max(2, Math.min(6, Math.ceil(displayCategories.length / 2)));
  }, [displayCategories.length]);

  const updateScrollState = useCallback(() => {
    if (!categoriesScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = categoriesScrollRef.current;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);

    if (maxScroll > 0) {
      const progress = Math.max(0, Math.min(1, scrollLeft / maxScroll));
      setScrollProgress(progress);
      const activeIdx = Math.min(totalDots - 1, Math.round(progress * (totalDots - 1)));
      setActiveDotIndex(activeIdx);
    } else {
      setScrollProgress(0);
      setActiveDotIndex(0);
    }
  }, [totalDots]);

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollState, displayCategories]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!categoriesScrollRef.current) return;
    const container = categoriesScrollRef.current;
    const scrollAmount = Math.max(260, container.clientWidth * 0.7);
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToDot = (dotIdx: number) => {
    if (!categoriesScrollRef.current) return;
    const container = categoriesScrollRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll <= 0) return;

    const targetLeft = (dotIdx / (totalDots - 1)) * maxScroll;
    container.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!categoriesScrollRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const container = categoriesScrollRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    if (maxScroll > 0) {
      container.scrollTo({
        left: ratio * maxScroll,
        behavior: 'smooth',
      });
    }
  };
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  const { currency } = useCurrency();
  const freeShippingMin = currency === 'LKR' ? 15000 : FREE_SHIPPING_THRESHOLD;

  const features = [
    { icon: Truck, title: 'Free Shipping', description: `Orders over ${formatCurrency(freeShippingMin)}` },
    { icon: Shield, title: 'Lab Tested', description: '100% quality verified' },
    { icon: Award, title: 'Premium Quality', description: 'Best ingredients' },
    { icon: Zap, title: 'Fast Results', description: 'Feel the difference' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
    },
  };

  return (
    <Layout accent="blue">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center overflow-hidden section-spotlight section-gray-0">
        {/* Animated Background */}
        <motion.div 
          style={{ y: heroY, scale: heroScale }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
            style={{ backgroundImage: `url(${heroBg})` }}
          />
          {/* Dual-theme athletic overlay with soft studio lighting */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/45 to-background dark:from-background/90 dark:via-background/70 dark:to-background" />
        </motion.div>

        {/* Ambient Hero Lighting Aura & Beam */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-white/70 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none ambient-glow-aura" />
        <div className="ambient-beam" />
        
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="relative container mx-auto px-4 text-center py-16 sm:py-24 z-10"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 mb-6 md:mb-8">
              <span className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-card/90 backdrop-blur-md text-xs sm:text-sm uppercase tracking-[0.18em] sm:tracking-[0.22em] font-semibold shadow-sm border border-border/80">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                #UnleashYourPower
                <Star className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={itemVariants}
              className="text-display text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.9] mb-6 md:mb-8"
            >
              <span className="block text-foreground font-black drop-shadow-sm">FUEL YOUR</span>
              <span className="block text-stroke-thick gradient-text font-black">ASCENT</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-12 leading-relaxed px-2"
            >
              Premium supplements engineered for peak performance. 
              <span className="text-foreground font-medium"> Unleash your power</span> with BEASTFUEL nutrition.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/products">
                <Button variant="hero" size="2xl" className="group">
                  Shop Now
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="hero-outline" size="2xl">
                  Learn More
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-3 gap-4 sm:gap-8 mt-10 md:mt-16 max-w-xl mx-auto"
            >
              {[
                { value: '50K+', label: 'Athletes' },
                { value: '99%', label: 'Pure' },
                { value: '4.9', label: 'Rating' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-card/60 backdrop-blur-sm border border-border/60 shadow-xs">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Bar - Section Gray Level 1 */}
      <section className="relative py-12 section-gray-1 border-y overflow-hidden">
        <div className="ambient-beam" />
        <div className="relative container mx-auto px-4 z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border/80 dark:border-border/60 hover-lift lighting-card cursor-default shadow-sm"
              >
                <div className="w-14 h-14 bg-secondary/80 dark:bg-neutral-900 border border-border/80 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-xs text-foreground">
                  <feature.icon className="h-6 w-6 transition-colors" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-wide text-foreground">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category - Section Gray Level 0 */}
      <section className="py-24 md:py-32 relative section-gray-0 section-spotlight overflow-hidden">
        <div className="ambient-beam" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-white/70 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none ambient-glow-aura" />
        
        <div className="relative container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-card text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground font-semibold mb-6 border border-border/80 shadow-sm">
              Browse Collection
            </span>
            <h2 className="text-display text-5xl md:text-7xl font-bold">
              SHOP BY <span className="text-stroke font-black">CATEGORY</span>
            </h2>
          </motion.div>

          {/* Carousel Viewport with Floating Controls */}
          <div className="relative group/carousel">
            {/* Left Edge Shadow/Gradient */}
            {canScrollLeft && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-12 md:w-20 bg-gradient-to-r from-background via-background/60 to-transparent z-10 hidden sm:block" />
            )}

            {/* Right Edge Shadow/Gradient */}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-12 md:w-20 bg-gradient-to-l from-background via-background/60 to-transparent z-10 hidden sm:block" />
            )}

            {/* Floating Left Arrow */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous categories"
              className={`hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center border transition-all backdrop-blur-md shadow-lg ${
                canScrollLeft
                  ? 'bg-card/90 hover:bg-card border-border hover:border-primary text-foreground hover:scale-105 active:scale-95 cursor-pointer opacity-80 hover:opacity-100'
                  : 'bg-card/40 border-border/30 text-muted-foreground/30 cursor-not-allowed opacity-0'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Horizontally Scrollable Categories */}
            <div
              ref={categoriesScrollRef}
              onScroll={updateScrollState}
              className="flex gap-4 md:gap-6 overflow-x-auto pb-4 pt-2 scroll-smooth snap-x snap-mandatory select-none no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayCategories.map((cat, i) => {
                const categoryImageUrl = cat.image
                  ? formatImageUrl(cat.image)
                  : 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80';
                const targetUrl = `/products?category=${encodeURIComponent(cat.name)}`;

                return (
                  <motion.div
                    key={cat._id || cat.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.5 }}
                    className="snap-start shrink-0 w-[165px] sm:w-[200px] md:w-[220px] lg:w-[calc((100%-5*1.5rem)/6)] min-w-[165px] sm:min-w-[190px]"
                  >
                    <Link
                      to={targetUrl}
                      className="group block relative aspect-[3/4] rounded-2xl overflow-hidden hover-lift shadow-sm hover:shadow-xl border border-border/80 dark:border-border/50 transition-all bg-zinc-900"
                    >
                      <img
                        src={categoryImageUrl}
                        alt={cat.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                        <h3 className="font-display text-lg md:text-xl font-bold uppercase tracking-wider text-white drop-shadow-sm">
                          {cat.name}
                        </h3>
                        <span className="text-xs text-white/80 uppercase tracking-widest group-hover:text-amber-400 transition-colors font-medium">
                          Shop Now →
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Floating Right Arrow */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next categories"
              className={`hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full items-center justify-center border transition-all backdrop-blur-md shadow-lg ${
                canScrollRight
                  ? 'bg-card/90 hover:bg-card border-border hover:border-primary text-foreground hover:scale-105 active:scale-95 cursor-pointer opacity-80 hover:opacity-100'
                  : 'bg-card/40 border-border/30 text-muted-foreground/30 cursor-not-allowed opacity-0'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Scrollbar & Pagination Dots */}
          <div className="mt-8 flex flex-col items-center gap-4">
            {/* Custom Interactive Scrollbar Track */}
            <div className="w-full max-w-xs sm:max-w-md flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  canScrollLeft
                    ? 'bg-card border-border hover:border-primary text-foreground hover:scale-105 active:scale-95 cursor-pointer shadow-xs'
                    : 'bg-muted/20 border-border/30 text-muted-foreground/30 cursor-not-allowed opacity-40'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Scroll Track & Indicator */}
              <div
                onClick={handleTrackClick}
                className="flex-1 h-2 bg-secondary/80 dark:bg-zinc-800/80 rounded-full relative cursor-pointer overflow-hidden border border-border/50 shadow-inner group/track hover:h-2.5 transition-all"
                title="Click to scroll categories"
              >
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-primary via-blue-500 to-amber-500 rounded-full transition-all duration-150 shadow-sm"
                  style={{
                    left: `${scrollProgress * 65}%`,
                    width: '35%',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleScroll('right')}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                  canScrollRight
                    ? 'bg-card border-border hover:border-primary text-foreground hover:scale-105 active:scale-95 cursor-pointer shadow-xs'
                    : 'bg-muted/20 border-border/30 text-muted-foreground/30 cursor-not-allowed opacity-40'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalDots }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => scrollToDot(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeDotIndex === dotIdx
                      ? 'w-7 h-2 bg-primary shadow-sm shadow-primary/30'
                      : 'w-2 h-2 bg-foreground/20 hover:bg-foreground/45 hover:scale-125'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Section Gray Level 1 */}
      <section className="py-24 md:py-32 relative section-gray-1 border-y overflow-hidden">
        <div className="ambient-beam" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent pointer-events-none opacity-50" />
        
        <div className="relative container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-2 rounded-full bg-card text-xs sm:text-sm uppercase tracking-[0.2em] text-foreground font-semibold mb-6 border border-border/80 shadow-sm"
            >
              Best Sellers
            </motion.span>
            <h2 className="text-display text-5xl md:text-7xl font-bold">
              FEATURED <span className="text-stroke font-black">PRODUCTS</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-16"
          >
            <Link to="/products">
              <Button variant="outline" size="xl" className="group bg-card shadow-xs">
                View All Products
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose BEASTFUEL - Section Gray Level 0 */}
      <section className="py-24 md:py-32 relative section-gray-0 section-spotlight overflow-hidden">
        <div className="ambient-beam" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-white/70 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none ambient-glow-aura" />
        
        <div className="relative container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-card text-sm uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-6 border border-border/80 shadow-sm">
              Why Athletes Choose Us
            </span>
            <h2 className="text-display text-5xl md:text-7xl">
              WHY <span className="text-stroke">BEASTFUEL</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg leading-relaxed">
              We don't cut corners. Every product is formulated with clinically dosed ingredients, third-party tested, and designed to deliver real results.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Dumbbell, title: 'Performance Driven', desc: 'Clinically dosed formulas designed for serious athletes who demand real, measurable results from every scoop.' },
              { icon: Shield, title: 'Third-Party Tested', desc: 'Every batch is independently lab-tested for purity, potency, and banned substances. Train with total confidence.' },
              { icon: Leaf, title: 'Clean Ingredients', desc: 'No fillers, no proprietary blends, no artificial junk. Just transparent labels with ingredients you can trust.' },
              { icon: HeartPulse, title: 'Science-Backed', desc: 'Formulated by sports nutritionists using peer-reviewed research. Every ingredient earns its place on the label.' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="p-6 rounded-2xl bg-card border border-border/80 dark:border-border/60 hover-lift lighting-card group shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary dark:bg-neutral-900 border border-border/80 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-xs">
                  <feature.icon className="w-5 h-5 text-foreground group-hover:text-primary-foreground transition-colors" />
                </div>
                <h4 className="font-bold text-base mb-2 text-foreground">{feature.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Category Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mt-12"
          >
            {['Whey Protein', 'Pre-Workout', 'Creatine', 'BCAAs', 'Mass Gainers', 'Vitamins', 'Fish Oil', 'Recovery'].map((cat) => (
              <span key={cat} className="px-4 py-2 rounded-full bg-card border border-border/80 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/40 shadow-xs transition-all cursor-default">
                {cat}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Section Gray Level 1 */}
      <section className="py-24 md:py-32 relative section-gray-1 border-y overflow-hidden">
        <div className="ambient-beam" />
        <div className="relative container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-card text-sm uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-6 border border-border/80 shadow-sm">
              What Our Customers Say
            </span>
            <h2 className="text-display text-5xl md:text-7xl">
              REAL <span className="text-stroke">REVIEWS</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { name: 'Marcus R.', role: 'Competitive Bodybuilder', rating: 5, quote: 'BEASTFUEL whey protein is hands down the cleanest I\'ve tried. No bloating, amazing mixability, and the chocolate flavor actually tastes incredible.' },
              { name: 'Sarah K.', role: 'CrossFit Athlete', rating: 5, quote: 'The pre-workout gives me insane focus without the jitters. I\'ve PR\'d three times since switching to BEASTFUEL. Absolutely love it!' },
              { name: 'David T.', role: 'Marathon Runner', rating: 4, quote: 'Their BCAA recovery blend has cut my recovery time in half. I can train harder and more consistently now. Great quality supplements.' },
              { name: 'Amaya L.', role: 'Fitness Coach', rating: 5, quote: 'I recommend BEASTFUEL to all my clients. Lab-tested, transparent ingredients, and results you can actually feel. Top tier brand.' },
              { name: 'Jake W.', role: 'Powerlifter', rating: 5, quote: 'The creatine monohydrate is pure and effective. Noticed strength gains within the first two weeks. Shipping was lightning fast too.' },
              { name: 'Nina P.', role: 'Yoga Instructor', rating: 4, quote: 'Love the plant-based protein option. It\'s gentle on my stomach and keeps me fueled through back-to-back classes. Highly recommend!' },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="p-6 md:p-8 rounded-2xl bg-card border border-border/80 dark:border-border/60 hover-lift lighting-card group relative shadow-sm"
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star key={starIdx} className={`w-4 h-4 ${starIdx < testimonial.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-foreground font-bold text-sm shadow-xs">{testimonial.name.charAt(0)}</div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Athletic Luxury Dark Banner - High Contrast Closing Statement */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-neutral-950 text-white">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="absolute inset-0 grid-pattern opacity-25" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-full h-full opacity-25"
            style={{
              background: "conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.15), transparent 30%)",
            }}
          />
        </div>

        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-8"
            >
              <span className="px-6 py-3 rounded-full bg-neutral-900 border border-neutral-800 text-sm uppercase tracking-[0.2em] text-neutral-300 font-semibold shadow-inner">
                Join 50,000+ Athletes
              </span>
            </motion.div>

            <h2 className="text-display text-5xl sm:text-6xl md:text-8xl leading-[0.9] mb-8">
              <span className="block text-white">READY TO</span>
              <span className="block gradient-text">TRANSFORM?</span>
            </h2>

            <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-xl mx-auto">
              Join thousands of athletes who trust BEASTFUEL for their supplement needs. 
              <span className="text-white font-medium"> Start your journey today.</span>
            </p>

            <Link to="/products">
              <Button variant="hero" size="2xl" className="group bg-white text-black hover:bg-neutral-200">
                Start Shopping
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;