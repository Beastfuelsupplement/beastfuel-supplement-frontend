import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/currency';

const Cart = () => {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();
  const shippingThreshold = 50;
  const freeShipping = totalPrice >= shippingThreshold;

  if (items.length === 0) {
    return (
      <Layout accent="orange">
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-display text-4xl mb-4">YOUR CART IS EMPTY</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any products yet.
            </p>
            <Link to="/products">
              <Button variant="hero" size="lg">
                Start Shopping
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout accent="orange">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display text-4xl md:text-5xl mb-12"
        >
          YOUR CART
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, index) => {
              const itemKey = item.cartItemId || item.id;
              const weightDisplay = item.selectedWeight || item.weight;
              const flavorDisplay = item.selectedFlavor || item.flavor;

              return (
                <motion.div
                  key={itemKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 p-6 bg-card border border-border rounded-xl hover:border-foreground/20 transition-all shadow-sm"
                >
                  <Link to={`/products/${item.id}`} className="shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        {item.brand && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            {item.brand}
                          </span>
                        )}
                        <Link to={`/products/${item.id}`}>
                          <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Variant Chips */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {weightDisplay && (
                            <span className="text-xs px-2.5 py-0.5 bg-secondary text-foreground rounded-md border border-border/60 font-medium">
                              Weight: <strong>{weightDisplay}</strong>
                            </span>
                          )}
                          {flavorDisplay && (
                            <span className="text-xs px-2.5 py-0.5 bg-primary/10 text-primary rounded-md border border-primary/20 font-medium">
                              Flavor: <strong>{flavorDisplay}</strong>
                            </span>
                          )}
                          {item.countryOfOrigin && (
                            <span className="text-xs px-2 py-0.5 bg-secondary/60 text-muted-foreground rounded-md">
                              {item.countryOfOrigin}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(itemKey)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold font-display text-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-lg p-6 sticky top-24 shadow-lg"
            >
              <h2 className="text-display text-2xl mb-6">ORDER SUMMARY</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={`font-medium ${freeShipping ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                    {freeShipping ? '✓ FREE' : formatCurrency(9.99)}
                  </span>
                </div>
                {!freeShipping && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Add {formatCurrency(shippingThreshold - totalPrice)} more for free shipping
                  </p>
                )}
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totalPrice + (freeShipping ? 0 : 9.99))}
                    </span>
                  </div>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button variant="hero" size="lg" className="w-full">
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>

              <Link to="/products" className="block mt-4">
                <Button variant="outline" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
