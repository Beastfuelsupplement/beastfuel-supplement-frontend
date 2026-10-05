import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, ArrowUpDown, Grid3X3, LayoutGrid, ChevronDown, X, Zap } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/products';
import { useProducts } from '@/hooks/useProducts';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const { data: products = [] } = useProducts();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL category param with state
  useEffect(() => {
    if (categoryFromUrl) {
      const matchedCategory = categories.find(
        (cat) => cat.toLowerCase() === categoryFromUrl.toLowerCase()
      );
      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
      }
    } else {
      setSelectedCategory('All');
    }
  }, [categoryFromUrl]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category.toLowerCase());
    }
    setSearchParams(searchParams);
  };
  
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name'>('name');

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    },
  };

  return (
    <Layout accent="orange">
      {/* Hero Header - Premium & Immersive */}
      <section className="relative min-h-[50vh] sm:min-h-[60vh] lg:min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Decorative lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent"
          />
        </div>
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Premium badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 mb-6 sm:mb-8"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/10 dark:border-primary/20">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm uppercase tracking-[0.2em] text-primary font-medium">
                  Premium Collection
                </span>
              </div>
            </motion.div>
            
            {/* Main heading with split animation */}
            <div className="overflow-hidden mb-4 sm:mb-6">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-foreground leading-[0.85]"
              >
                ALL
              </motion.h1>
            </div>
            <div className="overflow-hidden mb-6 sm:mb-8">
              <motion.h1 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-primary/80 dark:text-primary leading-[0.85]"
              >
                PRODUCTS
              </motion.h1>
            </div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-md sm:max-w-xl lg:max-w-2xl mx-auto leading-relaxed"
            >
              Elevate your performance with our scientifically formulated, 
              <span className="text-foreground font-medium"> lab-tested</span> supplements
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-12 mt-8 sm:mt-12"
            >
              {[
                { value: `${products.length}+`, label: 'Products' },
                { value: '99%', label: 'Pure' },
                { value: '4.9★', label: 'Rating' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground">Explore</span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </section>

      {/* Filters & Products Section */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full justify-between h-12 text-sm"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters & Search
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {/* Search & Filter Bar - Premium Glass Design */}
          <AnimatePresence>
            {(showFilters || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:block"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 lg:mb-10 p-4 sm:p-5 lg:p-6 bg-secondary/50 dark:bg-card/50 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-border/50"
                >
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 sm:h-12 lg:h-14 pl-11 sm:pl-12 pr-4 bg-background dark:bg-background/80 border border-border/50 rounded-xl lg:rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all text-sm sm:text-base"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
                      >
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground hidden sm:block" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="h-11 sm:h-12 lg:h-14 px-3 sm:px-4 bg-background dark:bg-background/80 border border-border/50 rounded-xl lg:rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer min-w-[140px] sm:min-w-[160px] text-sm sm:text-base"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>

                  {/* Grid Toggle - Desktop only */}
                  <div className="hidden xl:flex items-center gap-2 border-l border-border/50 pl-4">
                    <Button
                      variant={gridCols === 3 ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setGridCols(3)}
                      className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl"
                    >
                      <Grid3X3 className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                    <Button
                      variant={gridCols === 4 ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setGridCols(4)}
                      className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl"
                    >
                      <LayoutGrid className="h-4 w-4 lg:h-5 lg:w-5" />
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories - Horizontal scroll on mobile */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 sm:mb-8 lg:mb-10"
          >
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
              {categories.map((category, index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.04 }}
                  className="flex-shrink-0"
                >
                  <Button
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(category)}
                    className={`text-xs sm:text-sm px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 rounded-full transition-all duration-300 whitespace-nowrap ${
                      selectedCategory === category 
                        ? 'shadow-lg shadow-primary/20' 
                        : 'hover:bg-secondary/80 dark:hover:bg-card/80 border-border/50'
                    }`}
                  >
                    {category}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8"
          >
            <p className="text-sm sm:text-base text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            {(selectedCategory !== 'All' || searchQuery) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('All');
                }}
                className="text-xs sm:text-sm gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Clear All
              </Button>
            )}
          </motion.div>

          {/* Products Grid - Premium Layout */}
          {filteredProducts.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                gridCols === 3 
                  ? 'lg:grid-cols-3' 
                  : 'lg:grid-cols-3 xl:grid-cols-4'
              } gap-4 sm:gap-5 md:gap-6 lg:gap-8`}
            >
              {filteredProducts.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 sm:py-20 lg:py-24 bg-secondary/30 dark:bg-card/30 rounded-2xl lg:rounded-3xl border border-border/30"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary dark:bg-card rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Filter className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold mb-3 text-foreground">No products found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto px-4">
                Try adjusting your search or filters to find what you're looking for
              </p>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('All');
                }}
                className="rounded-full"
              >
                Reset Filters
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom CTA - Premium Design */}
      <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/80 to-background dark:from-card dark:via-card/80 dark:to-background" />
        <div className="absolute inset-0 grid-pattern opacity-[0.02] dark:opacity-10" />
        
        {/* Decorative elements */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl"
        />

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/10 dark:border-primary/20"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs sm:text-sm uppercase tracking-wider text-primary font-medium">Need Help?</span>
            </motion.div>

            <h3 className="text-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground mb-4 sm:mb-6 leading-tight">
              Can't find what you need?
            </h3>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto">
              Our experts are here to help you find the perfect supplements for your goals
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-full font-medium text-sm sm:text-base hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              Contact Us
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Products;