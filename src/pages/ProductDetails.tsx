import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield, Globe, Award, Check, Sparkles } from 'lucide-react';
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
import { formatCurrency } from '@/lib/currency';

const ProductDetails = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);

  const { data: product, isLoading } = useProduct(id);
  const { data: allProducts = [] } = useProducts();
  const { averageRating, totalReviews } = useReviews(id || '');

  // Extract available weights
  const availableWeights = useMemo(() => {
    if (!product) return [];
    if (product.weights && product.weights.length > 0) return product.weights;
    if (product.weight) return [product.weight];
    return ['Standard'];
  }, [product]);

  // Extract available flavors
  const availableFlavors = useMemo(() => {
    if (!product) return [];
    if (product.flavors && product.flavors.length > 0) return product.flavors;
    if (product.flavor) return [product.flavor];
    return [];
  }, [product]);

  // State for user selection
  const [selectedWeight, setSelectedWeight] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');

  // Set default weight and flavor when product loads
  useEffect(() => {
    if (availableWeights.length > 0 && !selectedWeight) {
      setSelectedWeight(availableWeights[0]);
    }
    if (availableFlavors.length > 0 && !selectedFlavor) {
      setSelectedFlavor(availableFlavors[0]);
    }
  }, [availableWeights, availableFlavors, selectedWeight, selectedFlavor]);

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

  const activePrice = activeVariant ? activeVariant.price : (product?.price ?? 0);
  const activeStock = activeVariant ? activeVariant.stock : (product?.stock ?? 0);

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
            <div className="relative aspect-square bg-secondary rounded-2xl overflow-hidden border border-border shadow-lg">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Category and Brand Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs uppercase tracking-wider font-bold rounded-lg shadow-md">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-background/90 backdrop-blur-md text-foreground text-xs font-semibold rounded-lg border border-border/50 shadow-sm flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {brandName}
                </span>
              </div>

              {/* Country of Origin Badge - Prominently Highlighted */}
              <div className="absolute top-4 right-4 z-10">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-neutral-950/90 text-white dark:bg-card/95 dark:text-foreground backdrop-blur-md rounded-xl border border-neutral-700/80 dark:border-border shadow-lg">
                  <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Made in <strong className="font-extrabold tracking-wider uppercase text-white dark:text-foreground">{countryOrigin}</strong></span>
                </span>
              </div>
            </div>

            {/* Thumbnail images if multiple */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => {}}
                    className="w-20 h-20 rounded-xl overflow-hidden border-2 border-primary/50 shrink-0"
                  >
                    <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
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
                <span className="text-xs uppercase tracking-wider font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  {brandName}
                </span>
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
              <div className="flex items-center gap-2 mb-5">
                <StarRating rating={Math.round(averageRating)} size="md" />
                <span className="text-muted-foreground text-sm">
                  {totalReviews > 0
                    ? `(${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})`
                    : '(4.9 rating • 50+ verified buyers)'}
                </span>
              </div>

              {/* Price display with variant awareness */}
              <div className="flex items-baseline gap-3 mb-6">
                <p className="text-3xl sm:text-4xl font-bold font-display text-foreground">
                  {formatCurrency(activePrice)}
                </p>
                {activeVariant && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border/50">
                    Price for {selectedWeight}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>

              {/* 1. WEIGHT SELECTION (Chips/Buttons) */}
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
                      const variantForWeight = product.variants?.find((v) => v.weight === w);
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
                          {variantForWeight && (
                            <span
                              className={`text-xs ml-0.5 ${
                                isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'
                              }`}
                            >
                              ({formatCurrency(variantForWeight.price)})
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
                      return (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setSelectedFlavor(fl)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/40 font-bold scale-[1.02]'
                              : 'bg-background hover:bg-secondary text-foreground border border-border/70 hover:border-foreground/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                          <span>{fl}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  {isOutOfStock ? (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      Out of Stock in this variant
                    </span>
                  ) : activeStock <= 10 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Low Stock - Only {activeStock} units left
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
                  <span className="text-lg font-bold w-8 text-center">{quantity}</span>
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
                variant="hero"
                size="xl"
                className="w-full text-base font-bold shadow-lg"
                onClick={handleAddToCart}
                disabled={isOutOfStock || maxQuantity === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isOutOfStock
                  ? 'Out of Stock'
                  : maxQuantity === 0
                  ? 'Max In Cart'
                  : `Add to Cart • ${formatCurrency(activePrice * quantity)}`}
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
                  <span>Free shipping on orders over Rs. 50</span>
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
    </Layout>
  );
};

export default ProductDetails;
