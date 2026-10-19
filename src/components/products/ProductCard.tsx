import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, Sparkles, Globe, Award, Gift, Flame, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/store/cartStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { formatCurrency, formatCurrencyParts } from '@/lib/currency';
import { formatImageUrl } from '@/lib/api';
import { calculateOfferPricing } from '@/lib/pricing';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const stock = product?.stock ?? 0;
  const productId = product?.id || product?._id || '';
  const cartQuantity = productId ? getItemQuantity(productId) : 0;
  const lowStockThreshold = product?.lowStockThreshold ?? 5;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= lowStockThreshold;

  const brandName = product.brand || 'BEASTFUEL';
  const countryOrigin = product.countryOfOrigin || 'USA';
  const weightsCount = product.weights?.length || (product.weight ? 1 : 0);
  const flavorsCount = product.flavors?.length || (product.flavor ? 1 : 0);

  // Find first available in-stock variant for smooth quick-add
  const inStockVariant = product.variants?.find((v) => Number(v.stock) > 0);
  const matchingVariant = inStockVariant || product.variants?.[0];
  const defaultWeight = matchingVariant?.weight || product.weights?.[0] || product.weight || '1kg';
  const defaultFlavor = matchingVariant?.flavor || product.flavors?.[0] || product.flavor || 'Standard';
  const defaultRegularPrice = matchingVariant ? matchingVariant.price : product.price;

  const pricing = calculateOfferPricing(defaultRegularPrice, {
    hasOffer: product.hasOffer,
    offerDiscount: product.offerDiscount,
    offerDiscountType: product.offerDiscountType,
    offerDiscountAmount: product.offerDiscountAmount,
    offerEndDate: product.offerEndDate,
    offerBadge: product.offerBadge,
  });

  const defaultPrice = pricing.offerPrice;
  const isOfferActive = pricing.hasOffer;
  const defaultStock = matchingVariant ? Number(matchingVariant.stock) : (product.stock ?? 0);

  // Variant-level actual stock calculation
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const totalVariants = product.variants?.length || 0;
  const soldOutVariantsCount = product.variants?.filter((v) => Number(v.stock) === 0).length || 0;
  const allVariantsSoldOut = hasVariants ? soldOutVariantsCount === totalVariants : isOutOfStock;
  const isDefaultVariantSoldOut = defaultStock === 0;
  const isDefaultVariantLowStock = defaultStock > 0 && defaultStock <= lowStockThreshold;
  const availableToAdd = defaultStock - cartQuantity;
  const isMaxInCart = availableToAdd <= 0 && defaultStock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (defaultStock <= 0 || isOutOfStock) {
      toast.error('All variants of this product are currently sold out');
      return;
    }

    addItem(product, 1, {
      weight: defaultWeight,
      flavor: defaultFlavor,
      price: defaultPrice,
      stock: defaultStock,
      variantId: matchingVariant?.id || matchingVariant?._id,
      sku: matchingVariant?.sku,
    });
    toast.success(`${product.name} (${defaultWeight}${defaultFlavor ? ` • ${defaultFlavor}` : ''}) added to cart`);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group h-full"
    >
      <Link to={`/products/${product.id}`} className="block h-full">
        <div className="relative h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border/80 dark:border-border/50 shadow-sm hover:shadow-xl hover:border-foreground/40 lighting-card transition-all duration-400 flex flex-col justify-between">
          
          {/* Image Container */}
          <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden shrink-0 bg-secondary/50 dark:bg-neutral-900/50">
            {/* Image */}
            <motion.img
              src={formatImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-contain p-2.5 sm:p-3.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            
            {/* Multi-layer gradient overlay - dark mode subtle blend */}
            <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-70" />
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
            </div>

            {/* Category & Offer Badges - Top Left */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-1.5 items-start z-10">
              {pricing.hasOffer && (
                <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs uppercase tracking-wider font-extrabold bg-gradient-to-r from-rose-600 to-amber-500 text-white rounded-full shadow-lg border border-rose-400/40 animate-pulse">
                  <Flame className="w-3 h-3 fill-white" />
                  {pricing.badge}
                </span>
              )}
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs uppercase tracking-wider font-bold bg-background/95 dark:bg-background/80 backdrop-blur-md rounded-full border border-border text-foreground shadow-sm"
              >
                {product.category}
              </motion.span>
              {isOutOfStock && (
                <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold bg-rose-600 text-white rounded-full shadow-md">
                  Sold Out
                </span>
              )}
            </div>

            {/* Rating Badge - Top Right */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
              <Link 
                to={`/products/${productId}#customer-reviews`}
                onClick={(e) => e.stopPropagation()}
                title={
                  (product.reviewsCount ?? 0) > 0
                    ? `${product.averageRating?.toFixed(1)} rating based on ${product.reviewsCount} reviews • Click to view or rate`
                    : 'No customer reviews yet • Click to rate this product!'
                }
              >
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold bg-background/85 dark:bg-background/70 backdrop-blur-md rounded-full border border-border/40 text-foreground shadow-sm hover:border-primary/50 transition-colors"
                >
                  {(product.reviewsCount ?? 0) > 0 ? (
                    <>
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-amber-400 text-amber-400" />
                      <span>{product.averageRating?.toFixed(1)}</span>
                      <span className="text-[9px] text-muted-foreground font-normal">({product.reviewsCount})</span>
                    </>
                  ) : (
                    <>
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground/60 hover:text-amber-400" />
                      <span className="text-[10px] text-muted-foreground font-medium">Rate</span>
                    </>
                  )}
                </motion.span>
              </Link>
            </div>

            {/* Sold Out Semi-Transparent Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/40 backdrop-blur-[1.5px] flex items-center justify-center p-4 pointer-events-none z-5">
                <span className="px-3.5 py-1.5 rounded-xl bg-rose-600/90 text-white font-black text-xs tracking-widest uppercase shadow-xl border border-rose-400/40">
                  Sold Out
                </span>
              </div>
            )}

            {/* Quick Actions - Bottom overlay on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-20">
              <div className="flex gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                <Button
                  variant={isOutOfStock ? "secondary" : "default"}
                  size="sm"
                  className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-xl backdrop-blur-md shadow-lg ${
                    isOutOfStock ? 'opacity-80 text-rose-600 dark:text-rose-400 cursor-not-allowed' : ''
                  }`}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  {isOutOfStock ? 'Sold Out' : 'Select & Add'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl backdrop-blur-md border border-border/50"
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
            {/* Brand & Product Name */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider mb-1">
                <Award className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">{brandName}</span>
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg lg:text-xl text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1 leading-tight">
                {product.name}
              </h3>
              
              {/* Variants Pill info (if multiple options available) */}
              {(weightsCount > 1 || flavorsCount > 1) && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                  {weightsCount > 1 && (
                    <span className="bg-secondary px-2 py-0.5 rounded-md border border-border/40 font-medium">
                      {weightsCount} Weights
                    </span>
                  )}
                  {flavorsCount > 1 && (
                    <span className="bg-secondary px-2 py-0.5 rounded-md border border-border/40 font-medium">
                      {flavorsCount} Flavors
                    </span>
                  )}
                </div>
              )}

              {/* Highlighted Country of Origin & Free Companion Gift */}
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md bg-secondary/80 dark:bg-card border border-border/80 text-foreground shadow-xs">
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-muted-foreground font-medium">Origin:</span>
                  <span className="font-bold text-foreground uppercase tracking-wide">{countryOrigin}</span>
                </span>

                {isOfferActive && product.offerFreeProduct && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-xs">
                    <Gift className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>+ Free: {product.offerFreeProduct}</span>
                  </span>
                )}
              </div>
            </div>
            
            {/* Price & Weight Row */}
            <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/30">
              <div className="flex flex-col">
                {pricing.hasOffer && pricing.savings > 0 && (
                  <span className="text-[11px] sm:text-xs text-muted-foreground line-through font-semibold">
                    {formatCurrency(pricing.regularPrice)}
                  </span>
                )}
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
                    {formatCurrencyParts(pricing.offerPrice).whole}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">{formatCurrencyParts(pricing.offerPrice).decimal}</span>
                </div>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-2.5 py-0.5 sm:py-1 bg-secondary dark:bg-card rounded-full border border-border/30">
                {product.weight || (product.weights && product.weights[0]) || 'Standard'}
              </span>
            </div>

            {/* Real Stock Indicator (Accurate Variant Data) */}
            <div className="pt-2 border-t border-border/40">
              {allVariantsSoldOut ? (
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    Sold Out
                  </span>
                  <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    Currently Unavailable
                  </span>
                </div>
              ) : hasVariants ? (
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isDefaultVariantSoldOut ? (
                      <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        Sold Out ({defaultWeight})
                      </span>
                    ) : isDefaultVariantLowStock ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        Low: {defaultStock} left ({defaultWeight})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        In Stock: {defaultStock} units ({defaultWeight})
                      </span>
                    )}
                  </div>
                  {soldOutVariantsCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
                      {soldOutVariantsCount} sold out
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {totalVariants} variant{totalVariants > 1 ? 's' : ''} stocked
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between text-[11px] sm:text-xs">
                  {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      Sold Out
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                      Low Stock: Only {stock} left
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      In Stock: {stock} units
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-medium">Standard</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;