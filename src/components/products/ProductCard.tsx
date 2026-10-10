import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, Sparkles, Globe, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/store/cartStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { formatCurrencyParts } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const getItemQuantity = useCartStore((state) => state.getItemQuantity);
  const stock = product.stock ?? 0;
  const cartQuantity = getItemQuantity(product.id);
  const availableToAdd = stock - cartQuantity;
  const maxStock = 100;
  const stockPercentage = Math.min((stock / maxStock) * 100, 100);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;
  const isMaxInCart = availableToAdd <= 0 && stock > 0;

  const brandName = product.brand || 'BEASTFUEL';
  const countryOrigin = product.countryOfOrigin || 'USA';
  const weightsCount = product.weights?.length || (product.weight ? 1 : 0);
  const flavorsCount = product.flavors?.length || (product.flavor ? 1 : 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    if (isMaxInCart) {
      toast.error('Maximum quantity already in cart');
      return;
    }
    const defaultWeight = product.weights?.[0] || product.weight || 'Standard';
    const defaultFlavor = product.flavors?.[0] || product.flavor;
    addItem(product, 1, {
      weight: defaultWeight,
      flavor: defaultFlavor,
      price: product.price,
      stock: product.stock,
    });
    toast.success(`${product.name} added to cart`);
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
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            
            {/* Multi-layer gradient overlay - dark mode subtle blend */}
            <div className="hidden dark:block absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-70" />
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent" />
            </div>

            {/* Category Badge - Top Left */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-1.5 items-start">
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs uppercase tracking-wider font-bold bg-background/95 dark:bg-background/80 backdrop-blur-md rounded-full border border-border text-foreground shadow-sm"
              >
                {product.category}
              </motion.span>
            </div>

            {/* Rating Badge - Top Right */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-background/80 dark:bg-background/60 backdrop-blur-md rounded-full border border-border/30 text-foreground"
              >
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-primary text-primary" />
                4.9
              </motion.span>
            </div>

            {/* Quick Actions - Bottom overlay on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <div className="flex gap-2 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 ease-out">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-xl backdrop-blur-md shadow-lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Select & Add
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
              
              {/* Variants Pill info (Quantity / Weight) */}
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
                {weightsCount <= 1 && flavorsCount <= 1 && (
                  <span className="font-medium">{product.weight || 'Standard'}</span>
                )}
              </div>

              {/* Highlighted Country of Origin - Below Quantity and Above Price */}
              <div className="mt-2.5 flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-semibold rounded-md bg-secondary/80 dark:bg-card border border-border/80 text-foreground shadow-xs">
                  <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-muted-foreground font-medium">Origin:</span>
                  <span className="font-bold text-foreground uppercase tracking-wide">{countryOrigin}</span>
                </span>
              </div>
            </div>
            
            {/* Price & Weight Row */}
            <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/30">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
                  {formatCurrencyParts(product.price).whole}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">{formatCurrencyParts(product.price).decimal}</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-2.5 py-0.5 sm:py-1 bg-secondary dark:bg-card rounded-full border border-border/30">
                {product.weight || (product.weights && product.weights[0]) || 'Standard'}
              </span>
            </div>

            {/* Stock indicator with animated bar */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1.5">
                <span className={`flex items-center gap-1 ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                </span>
                <span>{stock} available</span>
              </div>
              <div className="h-1 sm:h-1.5 bg-secondary dark:bg-card rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${
                    isOutOfStock 
                      ? 'bg-destructive' 
                      : isLowStock 
                        ? 'bg-gradient-to-r from-yellow-500/60 via-yellow-500 to-yellow-500/80' 
                        : 'bg-gradient-to-r from-primary/60 via-primary to-primary/80'
                  }`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stockPercentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: index * 0.05 + 0.4, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;