import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
  Package,
  Layers,
  ChevronRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useBrands } from '@/hooks/useBrands';
import { formatImageUrl } from '@/lib/api';
import { BrandLogo } from '@/components/common/BrandLogo';

const ALPHABET = [
  'ALL',
  '#',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

export default function Brands() {
  const { data: brands = [], isLoading } = useBrands();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');

  // Extract unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => {
      if (b.countryOfOrigin && b.countryOfOrigin.trim()) {
        set.add(b.countryOfOrigin.trim());
      }
    });
    return Array.from(set).sort();
  }, [brands]);

  // Determine which alphabet letters have brands
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    brands.forEach((b) => {
      const firstChar = (b.name || '').trim().charAt(0).toUpperCase();
      if (/[0-9]/.test(firstChar)) {
        letters.add('#');
      } else if (/[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      }
    });
    return letters;
  }, [brands]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        brand.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (brand.description && brand.description.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
        (brand.countryOfOrigin && brand.countryOfOrigin.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesOrigin =
        originFilter === 'ALL' ||
        (brand.countryOfOrigin && brand.countryOfOrigin.toLowerCase() === originFilter.toLowerCase());

      const firstChar = (brand.name || '').trim().charAt(0).toUpperCase();
      const matchesLetter =
        selectedLetter === 'ALL' ||
        (selectedLetter === '#' && /[0-9]/.test(firstChar)) ||
        firstChar === selectedLetter;

      return matchesSearch && matchesOrigin && matchesLetter;
    });
  }, [brands, searchQuery, originFilter, selectedLetter]);

  const featuredBrands = useMemo(() => {
    return brands.filter((b) => b.featured);
  }, [brands]);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-background pt-28 pb-14 border-b border-border/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.12),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.08),transparent_50%)] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6 uppercase tracking-wider">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-semibold">Brands</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-widest uppercase mb-4">
              <ShieldCheck className="w-4 h-4" />
              100% Verified Authentic Brands
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white leading-[1.05]">
              Shop By <span className="text-white">Brand</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Explore authentic, lab-tested supplements from globally acclaimed sports nutrition giants. 
              Directly imported with guaranteed purity, manufacturer batch codes, and untamed quality.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-border/40">
            <div className="p-3.5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-sm">
              <div className="text-2xl font-black text-foreground">{brands.length}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">World Brands</div>
            </div>
            <div className="p-3.5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-500">100%</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Imported & Genuine</div>
            </div>
            <div className="p-3.5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-sm">
              <div className="text-2xl font-black text-primary">Direct</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Authorized Retailer</div>
            </div>
            <div className="p-3.5 rounded-xl bg-card/60 border border-border/60 backdrop-blur-sm">
              <div className="text-2xl font-black text-white">Fast</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Islandwide Delivery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-10 space-y-10">

        {/* Featured Brands Highlight (if any) */}
        {featuredBrands.length > 0 && selectedLetter === 'ALL' && searchQuery === '' && originFilter === 'ALL' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
                  Featured Top Brands
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">Premier athletic nutrition</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
              {featuredBrands.map((fb) => (
                <Link
                  key={fb._id}
                  to={`/products?brand=${encodeURIComponent(fb.name)}`}
                  className="group relative flex flex-col items-center justify-center p-4 rounded-2xl bg-card/60 hover:bg-card border border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 text-center"
                >
                  <div className="w-full h-20 rounded-xl bg-white/95 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center p-2 mb-3 group-hover:scale-105 transition-transform overflow-hidden shadow-inner relative">
                    {fb.logo ? (
                      <div
                        id={`featured-logo-wrap-${fb._id}`}
                        className="w-full h-full rounded-lg bg-white flex items-center justify-center p-1.5 shadow-inner overflow-hidden"
                      >
                        <img
                          src={formatImageUrl(fb.logo)}
                          alt={fb.name}
                          className="w-full h-full max-h-16 object-contain filter contrast-125"
                          loading="lazy"
                          onError={() => {
                            const wrapEl = document.getElementById(`featured-logo-wrap-${fb._id}`);
                            if (wrapEl) wrapEl.style.display = 'none';
                            const fallbackEl = document.getElementById(`fallback-featured-${fb._id}`);
                            if (fallbackEl) fallbackEl.style.display = 'flex';
                          }}
                        />
                      </div>
                    ) : null}
                    <div
                      id={`fallback-featured-${fb._id}`}
                      style={{ display: fb.logo ? 'none' : 'flex' }}
                      className="w-full h-full rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-inner tracking-wider"
                    >
                      {fb.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {fb.name}
                  </h3>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {fb.productCount || 0} Products
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Filter Controls: Search & Country */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brands by name, country, or category..."
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Country Selector */}
            {countries.length > 0 && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                <select
                  value={originFilter}
                  onChange={(e) => setOriginFilter(e.target.value)}
                  className="h-11 px-3.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer font-medium"
                >
                  <option value="ALL">All Countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters */}
            {(searchQuery || originFilter !== 'ALL' || selectedLetter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setOriginFilter('ALL');
                  setSelectedLetter('ALL');
                }}
                className="gap-1.5 h-11 text-xs uppercase tracking-wider font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}
          </div>

          {/* Alphabet A-Z Bar */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Alphabetical Index:
              </span>
              <span className="text-[11px] text-muted-foreground">
                Showing {filteredBrands.length} of {brands.length} Brands
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              {ALPHABET.map((letter) => {
                const isSelected = selectedLetter === letter;
                const hasBrands = letter === 'ALL' || availableLetters.has(letter);

                return (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    disabled={!hasBrands}
                    className={`min-w-[32px] sm:min-w-[36px] h-8 sm:h-9 px-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : hasBrands
                        ? 'bg-secondary/60 hover:bg-secondary text-foreground hover:text-primary cursor-pointer'
                        : 'opacity-30 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Brand Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-card border border-border animate-pulse p-5 flex flex-col justify-between">
                <div className="w-full h-28 bg-muted rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border/80 rounded-2xl p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
              No Brands Found
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              We couldn't find any brands matching your current search query or filter selection.
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setOriginFilter('ALL');
                setSelectedLetter('ALL');
              }}
              className="gap-2 font-bold uppercase tracking-wider text-xs"
            >
              <RotateCcw className="w-4 h-4" /> Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredBrands.map((brand, index) => {
              const brandLink = `/products?brand=${encodeURIComponent(brand.name)}`;

              return (
                <motion.div
                  key={brand._id || brand.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * Math.min(index, 20), duration: 0.3 }}
                >
                  <Link
                    to={brandLink}
                    className="group relative flex flex-col justify-between h-full rounded-2xl bg-card border border-border/70 hover:border-primary/60 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1.5 overflow-hidden p-5"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {brand.countryOfOrigin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                          <Globe className="w-3 h-3 text-blue-500" />
                          {brand.countryOfOrigin}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <Award className="w-3 h-3 text-amber-500" />
                          Certified
                        </span>
                      )}

                      {brand.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                          Top Brand
                        </span>
                      )}
                    </div>

                    {/* Logo Showcase Area - Big prominent icon size filling the container */}
                    <div className="w-full h-32 rounded-xl bg-white/95 dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/80 flex items-center justify-center p-3 mb-4 group-hover:scale-[1.02] transition-transform duration-300 shadow-sm relative overflow-hidden">
                      {brand.logo ? (
                        <div
                          id={`brand-logo-wrap-${brand._id}`}
                          className="w-full h-full rounded-lg bg-white flex items-center justify-center p-2.5 shadow-inner overflow-hidden"
                        >
                          <img
                            src={formatImageUrl(brand.logo)}
                            alt={brand.name}
                            className="w-full h-full max-h-24 object-contain filter contrast-125"
                            loading="lazy"
                            onError={() => {
                              const wrapEl = document.getElementById(`brand-logo-wrap-${brand._id}`);
                              if (wrapEl) wrapEl.style.display = 'none';
                              const fallbackEl = document.getElementById(`fallback-monogram-${brand._id}`);
                              if (fallbackEl) fallbackEl.style.display = 'flex';
                            }}
                          />
                        </div>
                      ) : null}

                      {/* Monogram Fallback filling the full big icon container size */}
                      <div
                        id={`fallback-monogram-${brand._id}`}
                        style={{ display: brand.logo ? 'none' : 'flex' }}
                        className="w-full h-full rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 text-white font-black text-3xl items-center justify-center shadow-inner uppercase tracking-widest"
                      >
                        {brand.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 mb-4 flex-1">
                      <h2 className="text-lg font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {brand.name}
                      </h2>
                      {brand.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {brand.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Official imported nutritional supplements & performance formulas.
                        </p>
                      )}
                    </div>

                    {/* Footer Button / Product Count */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {brand.productCount !== undefined ? (
                          <>
                            <span className="text-primary font-black">{brand.productCount}</span>{' '}
                            {brand.productCount === 1 ? 'Product' : 'Products'}
                          </>
                        ) : (
                          'View Catalog'
                        )}
                      </span>

                      <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary group-hover:translate-x-1 transition-transform">
                        Explore <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom Importer Assurance Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-widest uppercase text-amber-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Direct Brand Importer Guarantee
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              Can't find a specific supplement brand?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              We continuously import verified fresh inventory directly from US and European manufacturers. Contact our team to request custom brand stock.
            </p>
          </div>

          <div className="flex gap-3 shrink-0">
            <Link to="/products">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider text-xs px-6 h-12 shadow-lg shadow-primary/20">
                View All Products
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
}
