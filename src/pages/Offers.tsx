import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Tag, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  Percent, 
  Package, 
  ShoppingCart,
  Star,
  Zap,
  Gift
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useAdminStore } from '@/store/adminStore';
import { useCartStore, Product } from '@/store/cartStore';
import { formatCurrency, formatCurrencyParts } from '@/lib/currency';
import { formatImageUrl } from '@/lib/api';
import { calculateOfferPricing } from '@/lib/pricing';
import { toast } from 'sonner';

const Offers = () => {
  const { data: apiProducts = [], isLoading } = useProducts(true);
  const storeProducts = useAdminStore((state) => state.products);
  const addItem = useCartStore((state) => state.addItem);

  // Combine products from API or local store
  const allProducts: Product[] = apiProducts.length > 0 ? apiProducts : storeProducts;

  // Filter products that have an active offer (and not expired)
  const offerProducts = allProducts.filter((p) => {
    const isExpired = Boolean(p.offerEndDate && new Date(p.offerEndDate).getTime() < Date.now());
    if (isExpired) return false;
    return Boolean(
      p.hasOffer ||
      (p.offerDiscount !== undefined && Number(p.offerDiscount) > 0) ||
      (p.offerDiscountAmount !== undefined && Number(p.offerDiscountAmount) > 0)
    );
  });

  // Live countdown timer state (24-hour cycle)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const firstInStockVariant = product.variants?.find((v) => Number(v.stock) > 0) || product.variants?.[0];
    const weight = firstInStockVariant?.weight || product.weights?.[0] || product.weight || '1kg';
    const flavor = firstInStockVariant?.flavor || product.flavors?.[0] || product.flavor || 'Standard';
    const regularPrice = firstInStockVariant?.price || product.price || 0;

    const pricing = calculateOfferPricing(regularPrice, {
      hasOffer: product.hasOffer ?? true,
      offerDiscount: product.offerDiscount,
      offerDiscountType: product.offerDiscountType,
      offerDiscountAmount: product.offerDiscountAmount,
      offerEndDate: product.offerEndDate,
      offerBadge: product.offerBadge,
    });

    addItem(product, 1, {
      weight,
      flavor,
      price: pricing.offerPrice,
      stock: firstInStockVariant ? Number(firstInStockVariant.stock) : product.stock,
      variantId: firstInStockVariant?.id || firstInStockVariant?._id,
      sku: firstInStockVariant?.sku,
    });
    toast.success(`${product.name} added to cart at special offer deal (${formatCurrency(pricing.offerPrice)})!`);
  };

  return (
    <Layout accent="orange">
      {/* Hero Banner with Deal Countdown */}
      <section className="relative min-h-[48vh] sm:min-h-[55vh] flex items-center justify-center overflow-hidden py-16 sm:py-20 border-b border-border/40">
        {/* Ambient lighting & decorative lines matching Products & About */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Promo Pill */}
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-6 shadow-xs">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Limited Time Exclusive Promotions</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-foreground leading-[0.9] mb-6">
              SPECIAL OFFERS <br className="hidden sm:block" />
              <span className="text-primary/90 dark:text-primary">
                & FLASH DEALS
              </span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
              Fuel your ambition with special discounts on top-tier protein powders, pre-workouts, and recovery formulas. Grab these deals before the timer runs out!
            </p>

            {/* Deal Countdown Clock Card */}
            <div className="inline-flex items-center gap-3 sm:gap-6 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-lg">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                <Clock className="w-4 h-4 animate-spin text-rose-500" style={{ animationDuration: '6s' }} />
                <span>Deals Expire In:</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-secondary/70 dark:bg-secondary px-3 py-2 rounded-xl text-center min-w-[50px] border border-border">
                  <span className="text-xl sm:text-2xl font-bold font-display text-foreground">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Hours</span>
                </div>
                <span className="text-xl font-bold text-rose-500">:</span>
                <div className="bg-secondary/70 dark:bg-secondary px-3 py-2 rounded-xl text-center min-w-[50px] border border-border">
                  <span className="text-xl sm:text-2xl font-bold font-display text-foreground">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Mins</span>
                </div>
                <span className="text-xl font-bold text-rose-500">:</span>
                <div className="bg-secondary/70 dark:bg-secondary px-3 py-2 rounded-xl text-center min-w-[50px] border border-border">
                  <span className="text-xl sm:text-2xl font-bold font-display text-rose-600 dark:text-rose-400">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Secs</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-4 border-y border-border/40 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Authentic Guarantee</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Free Island-wide Delivery</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Percent className="w-4 h-4 text-amber-500" />
              <span>Direct Manufacturer Discounts</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
              <Zap className="w-4 h-4 text-rose-500" />
              <span>Instant Dispatch & Tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Offer Products Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/50">
            <div>
              <h2 className="text-display text-2xl sm:text-3xl font-black uppercase text-foreground flex items-center gap-2.5">
                <Tag className="w-6 h-6 text-rose-500" />
                Featured Offer Products ({offerProducts.length})
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Click any offer product below to view complete nutrition facts, variant choices, and place your order.
              </p>
            </div>

            <Link to="/products">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-96 rounded-2xl bg-secondary/40 animate-pulse border border-border/50" />
              ))}
            </div>
          ) : offerProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {offerProducts.map((product, index) => {
                const firstInStockVariant = product.variants?.find((v) => Number(v.stock) > 0) || product.variants?.[0];
                const regularPrice = firstInStockVariant?.price || product.price || 0;

                const pricing = calculateOfferPricing(regularPrice, {
                  hasOffer: product.hasOffer ?? true,
                  offerDiscount: product.offerDiscount,
                  offerDiscountType: product.offerDiscountType,
                  offerDiscountAmount: product.offerDiscountAmount,
                  offerEndDate: product.offerEndDate,
                  offerBadge: product.offerBadge,
                });

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                    className="group"
                  >
                    <div className="relative h-full rounded-3xl bg-card border-2 border-rose-500/30 hover:border-rose-500 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden">
                      
                      {/* Top Promo Banner */}
                      <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white px-4 py-2 flex items-center justify-between text-xs font-black uppercase tracking-wider shadow-md">
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                          {pricing.badge}
                        </span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px]">
                          Save {formatCurrency(pricing.savings)}
                        </span>
                      </div>

                      {/* Image Preview with Link to Product Details */}
                      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-secondary/50">
                        <img
                          src={formatImageUrl(product.image)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />

                        {/* Category badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-background/90 backdrop-blur-md border border-border text-foreground shadow-sm">
                            {product.category}
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-background/90 backdrop-blur-md border border-border text-foreground shadow-sm">
                            {(product.reviewsCount ?? 0) > 0 ? (
                              <>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{product.averageRating?.toFixed(1)}</span>
                                <span className="text-[9px] text-muted-foreground font-normal">({product.reviewsCount})</span>
                              </>
                            ) : (
                              <>
                                <Star className="w-3 h-3 text-muted-foreground/60" />
                                <span className="text-[10px] text-muted-foreground font-medium">Rate</span>
                              </>
                            )}
                          </span>
                        </div>
                      </Link>

                      {/* Content Card Body */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between space-y-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">
                            {product.brand || 'BEASTFUEL'}
                          </p>

                          <Link to={`/products/${product.id}`}>
                            <h3 className="text-display text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>

                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        {/* Price Breakdown */}
                        <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Regular Price:</span>
                            <span className={`font-semibold ${pricing.savings > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {formatCurrency(pricing.regularPrice)}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between">
                            <span className="text-xs uppercase font-extrabold text-rose-500 tracking-wider">
                              Offer Deal:
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black font-display text-foreground">
                                {formatCurrencyParts(pricing.offerPrice).whole}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrencyParts(pricing.offerPrice).decimal}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>Your Total Savings:</span>
                            <span>
                              {pricing.savings > 0
                                ? `${formatCurrency(pricing.savings)} (${pricing.discountPercentage}% OFF)`
                                : `${formatCurrency(0)} (0% OFF)`}
                            </span>
                          </div>
                        </div>

                        {/* Free Companion Gift Banner */}
                        {product.offerFreeProduct && (
                          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            <Gift className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="truncate">Includes Free: {product.offerFreeProduct}</span>
                          </div>
                        )}

                        {/* Offer Expiry Date */}
                        {product.offerEndDate && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>Offer ends {new Date(product.offerEndDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2.5 pt-2">
                          <Link to={`/products/${product.id}`} className="w-full">
                            <Button 
                              variant="outline" 
                              className="w-full h-11 text-xs font-bold rounded-xl border-border hover:bg-secondary gap-1"
                            >
                              <span>View Product</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Button
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="w-full h-11 text-xs font-black rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Claim Offer</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 max-w-lg mx-auto bg-card rounded-3xl border border-border shadow-md">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Active Offers Right Now</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Our flash deals just wrapped up! Admins can create special product offers from the Admin Panel, or you can explore our complete supplement catalog.
              </p>
              <Link to="/products">
                <Button className="font-bold">
                  Browse All Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Promotion Policy / FAQ */}
      <section className="py-12 bg-secondary/30 border-t border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-xl font-bold text-foreground mb-6 text-center">
            Special Offer Terms & Guarantee
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 text-xs text-muted-foreground">
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Price Match
              </h4>
              <p>All offer discounts are applied directly at checkout with no coupon code required.</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Authentic Stock
              </h4>
              <p>Promotional items have verified batch numbers, fresh expiry dates, and tamper seals.</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fast Shipping
              </h4>
              <p>Orders placed during offer events receive expedited processing and free delivery.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Offers;
