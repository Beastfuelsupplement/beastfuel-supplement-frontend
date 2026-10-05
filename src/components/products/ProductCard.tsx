import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Star, Sparkles } from 'lucide-react';
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
  const maxStock = 100; // Reference for percentage calculation
  const stockPercentage = Math.min((stock / maxStock) * 100, 100);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;
  const isMaxInCart = availableToAdd <= 0 && stock > 0;

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
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group h-full"
    >
      <Link to={`/products/${product.id}`} className="block h-full">
        <div className="relative h-full overflow-hidden rounded-2xl sm:rounded-3xl bg-secondary/50 dark:bg-card/50 border border-border/30 dark:border-border/50 transition-all duration-500 group-hover:border-primary/20 dark:group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 dark:group-hover:shadow-primary/10">
          
          {/* Image Container */}
          <div className="relative aspect-[4/5] sm:aspect-square overflow-hidden">
            {/* Image */}
            <motion.img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            
            {/* Multi-layer gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80 dark:opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/40 dark:to-background/60" />
            
            {/* Hover glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/15 via-primary/5 to-transparent" />
            </div>

            {/* Category Badge - Top Left */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs uppercase tracking-wider font-medium bg-background/80 dark:bg-background/60 backdrop-blur-md rounded-full border border-border/30 text-foreground"
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
                  Add to Cart
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
          <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
            {/* Product Name */}
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg lg:text-xl text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1 leading-tight">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                Premium quality supplement
              </p>
            </div>
            
            {/* Price & Weight Row */}
            <div className="flex items-end justify-between gap-2">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
                  {formatCurrencyParts(product.price).whole}
                </span>
                <span className="text-xs sm:text-sm text-muted-foreground">{formatCurrencyParts(product.price).decimal}</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-2.5 py-0.5 sm:py-1 bg-secondary dark:bg-card rounded-full border border-border/30">
                {product.weight}
              </span>
            </div>

            {/* Stock indicator with animated bar */}
            <div className="pt-1 sm:pt-2">
              <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2">
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