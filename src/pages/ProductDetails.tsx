import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield, Globe, Award, Check, Sparkles, AlertTriangle, AlertCircle, Flame, Gift, Clock, Maximize2, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { useProducts, useProduct } from '@/hooks/useProducts';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import ProductReviews from '@/components/reviews/ProductReviews';
import StarRating from '@/components/reviews/StarRating';
import { useReviews } from '@/hooks/useReviews';
import { formatCurrency, FREE_SHIPPING_THRESHOLD } from '@/lib/currency';
import { formatImageUrl } from '@/lib/api';
import { calculateOfferPricing } from '@/lib/pricing';

const ProductDetails = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);

  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const { averageRating, totalReviews, userReview } = useReviews(id || '');

  useEffect(() => {
    if (window.location.hash === '#reviews' || window.location.hash === '#customer-reviews') {
      setTimeout(() => {
        const el = document.getElementById('customer-reviews');
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }, [id]);

  const scrollToReviews = (focusForm = false) => {
    const el = document.getElementById('customer-reviews');
    el?.scrollIntoView({ behavior: 'smooth' });
    if (focusForm) {
      setTimeout(() => {
        const input = document.getElementById('review-textarea') || document.querySelector('#customer-reviews textarea');
        if (input instanceof HTMLElement) {
          input.focus();
        }
      }, 500);
    }
  };

  const isOfferExpired = Boolean(product?.offerEndDate && new Date(product.offerEndDate).getTime() < Date.now());
  const isOfferActive = Boolean(product?.hasOffer && !isOfferExpired);

  // Extract all photos (primary + gallery)
  const allImages = useMemo(() => {
    if (!product) return [];
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [product]);

  const [activeImage, setActiveImage] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const currentImageIndex = useMemo(() => {
    const current = activeImage || product?.image || '';
    const idx = allImages.findIndex((img) => img === current);
    return idx >= 0 ? idx : 0;
  }, [activeImage, product?.image, allImages]);

  const handleNextImage = () => {
    if (allImages.length <= 1) return;
    const nextIdx = (currentImageIndex + 1) % allImages.length;
    setActiveImage(allImages[nextIdx]);
    setZoomLevel(1);
  };

  const handlePrevImage = () => {
    if (allImages.length <= 1) return;
    const prevIdx = (currentImageIndex - 1 + allImages.length) % allImages.length;
    setActiveImage(allImages[prevIdx]);
    setZoomLevel(1);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentImageIndex, allImages]);

  useEffect(() => {
    if (product?.image) {
      setActiveImage(product.image);
    } else if (allImages.length > 0) {
      setActiveImage(allImages[0]);
    }
  }, [product?.id, product?.image, allImages]);

  // Extract available weights (from active variants if available, or product metadata)
  const availableWeights = useMemo(() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) {
      const distinctWeights = Array.from(new Set(product.variants.map((v) => v.weight).filter(Boolean)));
      if (distinctWeights.length > 0) return distinctWeights;
    }
    if (product.weights && product.weights.length > 0) return product.weights;
    if (product.weight) return [product.weight];
    return ['Standard'];
  }, [product]);

  // State for user selection
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');

  // Extract available flavors SPECIFICALLY FOR THE SELECTED WEIGHT (sparse variant matrix)
  const availableFlavors = useMemo(() => {
    if (!product) return [];
    const currentWeight = selectedWeight || (availableWeights.length > 0 ? availableWeights[0] : '');

    if (product.variants && product.variants.length > 0) {
      // Filter variants that match current weight
      const matchingVariants = product.variants.filter(
        (v) => (v.weight || '').trim().toLowerCase() === currentWeight.trim().toLowerCase()
      );
      const fls = matchingVariants.map((v) => v.flavor?.trim()).filter(Boolean);
      if (fls.length > 0) {
        return Array.from(new Set(fls)) as string[];
      }
    }
    if (product.flavors && product.flavors.length > 0) return product.flavors;
    if (product.flavor) return [product.flavor];
    return [];
  }, [product, selectedWeight, availableWeights]);

  // Ensure default weight is selected
  useEffect(() => {
    if (availableWeights.length > 0) {
      if (!selectedWeight || !availableWeights.includes(selectedWeight)) {
        setSelectedWeight(availableWeights[0]);
      }
    }
  }, [availableWeights, selectedWeight]);

  // Auto-align flavor when selected weight changes
  useEffect(() => {
    if (availableFlavors.length > 0) {
      if (!selectedFlavor || !availableFlavors.includes(selectedFlavor)) {
        // If possible, pick first in-stock flavor for this weight
        const firstInStock = availableFlavors.find((fl) => {
          const v = product?.variants?.find(
            (item) => item.weight === selectedWeight && item.flavor === fl
          );
          return v && v.stock > 0;
        });
        setSelectedFlavor(firstInStock || availableFlavors[0]);
      }
    }
  }, [availableFlavors, selectedFlavor, selectedWeight, product?.variants]);

  // Calculate active variant details (price, stock)
  const activeVariant = useMemo(() => {
    if (!product || !product.variants || product.variants.length === 0) return null;
    return (
      product.variants.find(
        (v) =>
          v.weight === selectedWeight &&
          (!v.flavor || v.flavor === selectedFlavor)
      ) ||
      product.variants.find((v) => v.weight === selectedWeight) ||
      null
    );
  }, [product, selectedWeight, selectedFlavor]);

  // Compute offer specific to the currently selected weight
  const currentWeightOffer = useMemo(() => {
    if (!product) return null;
    const currentWeight = (selectedWeight || (availableWeights.length > 0 ? availableWeights[0] : '')).trim().toLowerCase();

    // 1. Check if product has explicit weightOffers matching current weight
    if (product.weightOffers && product.weightOffers.length > 0) {
      const match = product.weightOffers.find(
        (wo) => wo.weight.trim().toLowerCase() === currentWeight
      );
      if (match) {
        return {
          hasOffer: Boolean(match.hasOffer),
          originalPrice: match.originalPrice,
          offerDiscount: match.offerDiscount,
          offerDiscountType: match.offerDiscountType,
          offerDiscountAmount: match.offerDiscountAmount,
          offerBadge: match.offerBadge,
          offerFreeProduct: match.offerFreeProduct,
          offerEndDate: product.offerEndDate,
        };
      }
    }

    // 2. Check activeVariant
    if (activeVariant && activeVariant.hasOffer !== undefined) {
      return {
        hasOffer: Boolean(activeVariant.hasOffer),
        originalPrice: activeVariant.originalPrice,
        offerDiscount: activeVariant.offerDiscount,
        offerDiscountType: activeVariant.offerDiscountType,
        offerDiscountAmount: activeVariant.offerDiscountAmount,
        offerBadge: activeVariant.offerBadge,
        offerFreeProduct: activeVariant.offerFreeProduct,
        offerEndDate: product.offerEndDate,
      };
    }

    // 3. If scope is explicitly 'weights' and no match was found, then this weight has NO offer
    if (product.offerScope === 'weights') {
      return null;
    }

    // 4. Fallback to global product offer
    if (product.hasOffer) {
      return {
        hasOffer: true,
        originalPrice: product.originalPrice,
        offerDiscount: product.offerDiscount,
        offerDiscountType: product.offerDiscountType,
        offerDiscountAmount: product.offerDiscountAmount,
        offerBadge: product.offerBadge,
        offerFreeProduct: product.offerFreeProduct,
        offerEndDate: product.offerEndDate,
      };
    }

    return null;
  }, [product, selectedWeight, availableWeights, activeVariant]);

  const isCurrentWeightOfferActive = Boolean(
    !isOfferExpired &&
    currentWeightOffer &&
    currentWeightOffer.hasOffer !== false
  );

  const activeRegularPrice = activeVariant ? activeVariant.price : (product?.price ?? 0);
  const activeStock = activeVariant ? activeVariant.stock : (product?.stock ?? 0);

  const activePricing = useMemo(() => {
    return calculateOfferPricing(
      activeRegularPrice,
      isCurrentWeightOfferActive ? currentWeightOffer : null
    );
  }, [activeRegularPrice, isCurrentWeightOfferActive, currentWeightOffer]);

  const activePrice = activePricing.offerPrice;

  const cartItemId = product
    ? `${product.id}-${selectedWeight || product.weight || 'Standard'}-${selectedFlavor || product.flavor || 'default'}`
    : '';
  const cartQuantity = product ? getItemQuantity(cartItemId) : 0;
  const availableToAdd = activeStock - cartQuantity;
  const isOutOfStock = activeStock === 0;
  const maxQuantity = Math.max(0, availableToAdd);

  const relatedProducts = allProducts
    .filter((p) => p.id !== id && (p.category === product?.category || p.brand === product?.brand))
    .slice(0, 4);

  if (isLoading) {
    return (
      <Layout accent="orange">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout accent="orange">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold mb-4">Product not found</h1>
          <Link to="/products">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error('This option is currently out of stock');
      return;
    }
    if (quantity > availableToAdd) {
      toast.error(`Only ${availableToAdd} more available for this variant`);
      return;
    }

    addItem(product, quantity, {
      weight: selectedWeight,
      flavor: selectedFlavor,
      price: activePrice,
      stock: activeStock,
      variantId: activeVariant?.id || activeVariant?._id,
      sku: activeVariant?.sku,
    });

    const variantDesc = [selectedWeight, selectedFlavor].filter(Boolean).join(' • ');
    toast.success(
      `${quantity} x ${product.name} ${variantDesc ? `(${variantDesc})` : ''} added to cart`
    );
    setQuantity(1);
  };

  const brandName = product.brand || 'BEASTFUEL';
  const countryOrigin = product.countryOfOrigin || 'USA';

  return (
    <Layout accent="orange">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Breadcrumb: Brand -> Product Name -> Category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
        >
          <Link to="/products" className="inline-flex items-center hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Products
          </Link>
          <span>/</span>
          <Link to={`/products?brand=${encodeURIComponent(brandName)}`} className="hover:text-primary transition-colors font-medium">
            {brandName}
          </Link>
          <span>/</span>
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-primary transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-xs">{product.name}</span>
        </motion.div>

        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <div 
              onClick={() => {
                setZoomLevel(1);
                setIsLightboxOpen(true);
              }}
              className="relative aspect-square bg-card/70 dark:bg-card/40 rounded-2xl overflow-hidden border border-border shadow-lg flex items-center justify-center p-3 sm:p-5 cursor-zoom-in group select-none transition-all hover:border-primary/40"
              title="Click to view full photo and zoom in"
            >
              <img
                src={formatImageUrl(activeImage || product.image)}
                alt={product.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />

              {/* Category and Brand Badges - discreetly placed with small padding so they don't cover text */}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
                <span className="px-2.5 py-1 bg-primary/95 text-primary-foreground text-[11px] uppercase tracking-wider font-bold rounded-md shadow-sm">
                  {product.category}
                </span>
                <span className="px-2.5 py-1 bg-background/85 backdrop-blur-md text-foreground text-[11px] font-semibold rounded-md border border-border/60 shadow-xs flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  {brandName}
                </span>
              </div>

              {/* Click to Enlarge Badge */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(1);
                  setIsLightboxOpen(true);
                }}
                className="absolute top-3 right-3 z-10 px-2.5 py-1.5 rounded-lg bg-background/85 hover:bg-background border border-border/70 backdrop-blur-md shadow-xs text-foreground transition-all flex items-center gap-1.5 text-xs font-semibold hover:scale-105 active:scale-95 cursor-pointer"
                title="Enlarge & Zoom Photo"
              >
                <Maximize2 className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Zoom Full View</span>
              </button>
            </div>

            {/* All Product Photos / Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {allImages.map((img, i) => {
                  const isSelected = (activeImage || product.image) === img;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(img)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-card/80 p-1 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/40 shadow-md scale-105'
                          : 'border-border/70 hover:border-border opacity-70 hover:opacity-100'
                      }`}
                      title={`View photo ${i + 1}`}
                    >
                      <img
                        src={formatImageUrl(img)}
                        alt={`${product.name} photo ${i + 1}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-auto">
              {/* Brand and Origin Tagline */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-3">
                <Link
                  to={`/products?brand=${encodeURIComponent(brandName)}`}
                  className="text-xs uppercase tracking-wider font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors inline-flex items-center gap-1 group"
                  title={`View all products by ${brandName}`}
                >
                  <span>{brandName}</span>
                  <span className="text-[10px] opacity-70 group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/90 dark:bg-card text-xs font-semibold text-foreground border border-border/80 shadow-xs">
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-muted-foreground font-medium">Origin:</span>
                  <span className="font-bold text-foreground uppercase tracking-wider">{countryOrigin}</span>
                </span>
              </div>

              <h1 className="text-display text-3xl sm:text-4xl md:text-5xl mb-3 text-foreground">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center flex-wrap gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => scrollToReviews(false)}
                  className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
                  title="Click to view all reviews and ratings"
                >
                  <StarRating rating={Math.round(averageRating)} size="md" />
                  {totalReviews > 0 ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-bold text-foreground">{averageRating.toFixed(1)}</span>
                      <span className="text-muted-foreground group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">
                        ({totalReviews} {totalReviews === 1 ? 'customer review' : 'customer reviews'})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm group-hover:text-primary transition-colors underline-offset-4 group-hover:underline">
                      No ratings yet • Be the first to rate
                    </span>
                  )}
                </button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => scrollToReviews(true)}
                  className="text-xs font-semibold h-7 px-3 rounded-full border-primary/30 hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  {userReview ? '★ Edit Your Rating' : '★ Rate Product'}
                </Button>
              </div>

              {/* Special Offer Alert Banner if product has an active offer for the selected weight */}
              {isCurrentWeightOfferActive && activePricing.hasOffer && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-rose-500/15 border-2 border-rose-500/40 flex items-center justify-between gap-3 shadow-sm flex-wrap">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                    <Flame className="w-4 h-4 fill-rose-500 animate-pulse shrink-0" />
                    <span>Special Offer ({selectedWeight}): {activePricing.badge}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {product?.offerEndDate && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Ends {new Date(product.offerEndDate).toLocaleDateString()}
                      </span>
                    )}
                    <Link to="/offers" className="text-xs font-bold text-rose-500 hover:underline">
                      All Offers →
                    </Link>
                  </div>
                </div>
              )}

              {/* Price display with variant awareness */}
              <div className="flex items-baseline gap-3 mb-6 flex-wrap">
                <p className="text-3xl sm:text-4xl font-bold font-display text-foreground">
                  {formatCurrency(activePricing.offerPrice)}
                </p>
                {activePricing.hasOffer && activePricing.savings > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg text-muted-foreground line-through font-semibold">
                      {formatCurrency(activePricing.regularPrice)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/15 text-rose-500 border border-rose-500/30">
                      Save {formatCurrency(activePricing.savings)} ({activePricing.discountPercentage}% OFF)
                    </span>
                  </div>
                )}
                {activeVariant && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border/50">
                    Price for {selectedWeight}
                  </span>
                )}
              </div>

              {/* Free Companion Gift Box */}
              {isCurrentWeightOfferActive && (currentWeightOffer?.offerFreeProduct || product?.offerFreeProduct) && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-2 border-emerald-500/40 flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Gift className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Free Bonus Companion Gift ({selectedWeight}) Included
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      {currentWeightOffer?.offerFreeProduct || product?.offerFreeProduct}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    FREE
                  </span>
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product?.description}
              </p>

              {/* 1. WEIGHT SELECTION (Chips/Buttons with Offer Highlights) */}
              {availableWeights.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Select Weight:
                      <span className="text-primary font-bold">{selectedWeight}</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {availableWeights.length} weight option{availableWeights.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {availableWeights.map((w) => {
                      const isSelected = selectedWeight === w;
                      const matchWo = product?.weightOffers?.find(wo => wo.weight.trim().toLowerCase() === w.trim().toLowerCase());
                      const hasWOffer = !isOfferExpired && (
                        matchWo 
                          ? Boolean(matchWo.hasOffer)
                          : (product?.offerScope !== 'weights' && Boolean(product?.hasOffer))
                      );
                      const wBadge = matchWo?.offerBadge || (
                        matchWo?.offerDiscountType === 'fixed' && matchWo?.offerDiscountAmount
                          ? `${formatCurrency(matchWo.offerDiscountAmount)} OFF`
                          : matchWo?.offerDiscount
                          ? `${matchWo.offerDiscount}% OFF`
                          : product?.offerBadge || 'OFFER'
                      );

                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWeight(w)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 font-bold scale-[1.02]'
                              : 'bg-background hover:bg-secondary text-foreground border border-border/70 hover:border-foreground/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{w}</span>
                          {hasWOffer && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 uppercase ${
                              isSelected
                                ? 'bg-black/30 text-white'
                                : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            }`}>
                              <Flame className="w-2.5 h-2.5 fill-current" />
                              {wBadge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. FLAVOR SELECTION (Chips/Buttons) */}
              {availableFlavors.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-secondary/40 border border-border/60">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Select Flavor:
                      <span className="text-primary font-bold">{selectedFlavor}</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {availableFlavors.length} flavor option{availableFlavors.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {availableFlavors.map((fl) => {
                      const isSelected = selectedFlavor === fl;
                      const flVariant = product.variants?.find(
                        (v) =>
                          (v.weight || '').trim().toLowerCase() === (selectedWeight || '').trim().toLowerCase() &&
                          (v.flavor || '').trim().toLowerCase() === fl.trim().toLowerCase()
                      );
                      const flStock = flVariant ? flVariant.stock : (product.stock ?? 0);
                      const isFlSoldOut = flStock === 0;

                      return (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setSelectedFlavor(fl)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            isSelected && isFlSoldOut
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-2 border-rose-500/60 shadow-md ring-2 ring-rose-500/20 font-bold scale-[1.02]'
                              : isSelected
                              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 font-bold scale-[1.02]'
                              : isFlSoldOut
                              ? 'bg-background hover:bg-secondary/70 text-foreground/70 border border-border/70 hover:border-rose-500/40'
                              : 'bg-background hover:bg-secondary text-foreground border border-border/70 hover:border-foreground/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{fl}</span>
                          {isFlSoldOut && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              Sold Out
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sold Out Alert Banner */}
              {isOutOfStock && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Sold Out in this Weight & Flavor</p>
                    <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-0.5 leading-relaxed">
                      The <strong>{selectedFlavor || 'Standard'}</strong> flavor in <strong>{selectedWeight || 'Standard'}</strong> is currently sold out. Please select another available flavor or weight above, or check back soon!
                    </p>
                  </div>
                </div>
              )}

              {/* Low Stock Alert Banner */}
              {!isOutOfStock && activeStock <= (product.lowStockThreshold ?? 5) && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Low Stock Alert: Only {activeStock} units left in stock! (Threshold: {product.lowStockThreshold ?? 5} units) Order now to secure yours.</span>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  {isOutOfStock ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs uppercase font-extrabold tracking-wider">
                        Sold Out (0 Available)
                      </span>
                    </span>
                  ) : activeStock <= (product.lowStockThreshold ?? 5) ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Low Stock Alert - Only {activeStock} units left
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {activeStock} units in stock
                    </span>
                  )}
                </div>
                {cartQuantity > 0 && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-md">
                    ({cartQuantity} of this variant in cart)
                  </span>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-6 mb-8">
                <span className="text-sm font-medium text-foreground">Quantity</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-bold w-8 text-center">{isOutOfStock ? 0 : quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl"
                    onClick={() => setQuantity(Math.min(quantity + 1, maxQuantity))}
                    disabled={isOutOfStock || quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button
                variant={isOutOfStock ? "outline" : "hero"}
                size="xl"
                className={`w-full text-base font-bold shadow-lg transition-all ${
                  isOutOfStock
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 cursor-not-allowed'
                    : ''
                }`}
                onClick={handleAddToCart}
                disabled={isOutOfStock || maxQuantity === 0}
              >
                {isOutOfStock ? (
                  <>
                    <AlertCircle className="h-5 w-5 mr-2 text-rose-500 shrink-0" />
                    Sold Out • Currently Unavailable
                  </>
                ) : maxQuantity === 0 ? (
                  'Max In Cart'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart • {formatCurrency(activePrice * quantity)}
                  </>
                )}
              </Button>

              {/* Summary pills */}
              <div className="p-3 bg-secondary/50 rounded-xl border border-border/50 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                <span>Selected: <strong className="text-foreground">{selectedWeight}</strong></span>
                {selectedFlavor && <span>Flavor: <strong className="text-foreground">{selectedFlavor}</strong></span>}
                <span>Origin: <strong className="text-foreground">{countryOrigin}</strong></span>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                  <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Free shipping on orders over {formatCurrency(FREE_SHIPPING_THRESHOLD)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                  <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>100% Genuine Imported Brand</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Reviews */}
        {id && <ProductReviews productId={id} />}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 pt-20 border-t border-border">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs uppercase tracking-widest text-primary font-bold">You may also like</span>
                <h2 className="text-display text-2xl sm:text-3xl md:text-4xl">RELATED SUPPLEMENTS</h2>
              </div>
              <Link to="/products" className="text-sm font-semibold text-primary hover:underline">
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fullscreen High-Res Image Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div 
            className="flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm sm:text-base font-bold truncate max-w-xs sm:max-w-md">
                {product?.name}
              </span>
              {allImages.length > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium text-white/80">
                  {currentImageIndex + 1} / {allImages.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                disabled={zoomLevel >= 3}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
              {/* Reset Zoom */}
              {zoomLevel > 1 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer"
                >
                  Reset ({zoomLevel}x)
                </button>
              )}
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors ml-2 cursor-pointer"
                title="Close (ESC)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Photo Viewport */}
          <div 
            className="flex-1 flex items-center justify-center relative my-4 overflow-auto cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Photo Arrow */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* The Image */}
            <div className="max-w-5xl max-h-[75vh] flex items-center justify-center p-2">
              <img
                src={formatImageUrl(activeImage || product?.image)}
                alt={product?.name}
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-w-full max-h-[75vh] object-contain select-none rounded-lg"
              />
            </div>

            {/* Next Photo Arrow */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {allImages.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setActiveImage(img);
                    setZoomLevel(1);
                  }}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all p-1 bg-zinc-900 cursor-pointer ${
                    (activeImage || product?.image) === img
                      ? 'border-primary ring-2 ring-primary/50 scale-105'
                      : 'border-white/30 hover:border-white/70 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={formatImageUrl(img)}
                    alt={`Thumbnail ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ProductDetails;
