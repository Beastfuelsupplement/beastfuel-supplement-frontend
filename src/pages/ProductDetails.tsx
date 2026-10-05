import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Minus, Plus, ArrowLeft, Truck, Shield } from 'lucide-react';
import { useState } from 'react';
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
  const relatedProducts = allProducts.filter((p) => p.id !== id && p.category === product?.category).slice(0, 4);

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

  const stock = product.stock ?? 0;
  const cartQuantity = getItemQuantity(product.id);
  const availableToAdd = stock - cartQuantity;
  const isOutOfStock = stock === 0;
  const maxQuantity = Math.max(0, availableToAdd);

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error('This product is out of stock');
      return;
    }
    if (quantity > availableToAdd) {
      toast.error(`Only ${availableToAdd} more available`);
      return;
    }
    addItem(product, quantity);
    toast.success(`${quantity} x ${product.name} added to cart`);
    setQuantity(1);
  };

  return (
    <Layout accent="orange">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </motion.div>

        {/* Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-square bg-secondary overflow-hidden"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-6 left-6 px-4 py-2 bg-primary text-primary-foreground text-sm uppercase tracking-wider font-medium">
              {product.category}
            </span>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-auto">
              <h1 className="text-display text-4xl md:text-5xl mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={Math.round(averageRating)} size="md" />
                <span className="text-muted-foreground text-sm">
                  {totalReviews > 0 
                    ? `(${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'})`
                    : '(No reviews yet)'}
                </span>
              </div>

              <p className="text-3xl font-semibold mb-8">{formatCurrency(product.price)}</p>

              <p className="text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>

              {/* Product Info */}
              <div className="flex gap-8 mb-8">
                <div>
                  <span className="text-sm text-muted-foreground">Weight</span>
                  <p className="font-medium">{product.weight}</p>
                </div>
                {product.flavor && (
                  <div>
                    <span className="text-sm text-muted-foreground">Flavor</span>
                    <p className="font-medium">{product.flavor}</p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-4">
                {isOutOfStock ? (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">● Out of Stock</span>
                ) : stock <= 10 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">● Low Stock - Only {stock} left</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">● {stock} in stock</span>
                )}
                {cartQuantity > 0 && (
                  <span className="text-muted-foreground ml-2">({cartQuantity} in cart)</span>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-6 mb-8">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-medium w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
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
                className="w-full" 
                onClick={handleAddToCart}
                disabled={isOutOfStock || maxQuantity === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isOutOfStock ? 'Out of Stock' : maxQuantity === 0 ? 'Max in Cart' : `Add to Cart - ${formatCurrency(product.price * quantity)}`}
              </Button>

              {/* Trust Badges */}
              <div className="flex gap-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-5 w-5 text-blue-500" />
                  Free shipping over Rs. 50
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-emerald-500" />
                  30-day money back
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
            <h2 className="text-display text-3xl md:text-4xl mb-12">RELATED PRODUCTS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetails;
