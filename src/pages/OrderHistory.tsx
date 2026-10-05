import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Calendar, ChevronRight, ChevronLeft,
  Truck, CheckCircle, Clock, XCircle, MapPin, ArrowLeft
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStore, Order } from '@/store/adminStore';
import { formatCurrency } from '@/lib/currency';

const OrderHistory = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { orders } = useAdminStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Get user orders
  const userOrders = orders.filter(
    (order: Order) => order.customerEmail.toLowerCase() === user?.email?.toLowerCase()
  );

  // If orderId is provided, find and display that order
  const displayOrder = orderId 
    ? userOrders.find(o => o.id === orderId) || selectedOrder
    : selectedOrder;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered': return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'shipped': return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'processing': return 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30';
      case 'pending': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'cancelled': return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered': return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'shipped': return <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'processing': return <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />;
      case 'pending': return <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getStatusSteps = (currentStatus: string) => {
    const statuses = ['Pending', 'Processing', 'Shipped', 'Completed'];
    const currentIndex = statuses.findIndex(s => s.toLowerCase() === currentStatus.toLowerCase());
    
    if (currentStatus.toLowerCase() === 'cancelled') {
      return statuses.map((status, index) => ({
        status,
        completed: false,
        current: false,
        cancelled: true
      }));
    }
    
    return statuses.map((status, index) => ({
      status,
      completed: index < currentIndex,
      current: index === currentIndex,
      cancelled: false
    }));
  };

  if (isLoading) {
    return (
      <Layout accent="blue">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout accent="blue">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">
              {displayOrder ? 'ORDER DETAILS' : 'ORDER HISTORY'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {displayOrder 
                ? `Order #${displayOrder.id.slice(-8).toUpperCase()}` 
                : `You have ${userOrders.length} order${userOrders.length !== 1 ? 's' : ''}`}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button 
              variant="ghost" 
              onClick={() => displayOrder ? (orderId ? navigate('/order-history') : setSelectedOrder(null)) : navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {displayOrder ? 'Back to Orders' : 'Back to Dashboard'}
            </Button>
          </motion.div>

          <AnimatePresence mode="wait">
            {displayOrder ? (
              /* Order Details View */
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Status Tracker */}
                <div className="glass-card p-6">
                  <h2 className="text-display text-xl mb-6">ORDER STATUS</h2>
                  
                  {displayOrder.status.toLowerCase() === 'cancelled' ? (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Order Cancelled</p>
                        <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute top-6 left-0 right-0 h-1 bg-secondary rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(getStatusSteps(displayOrder.status).filter(s => s.completed).length / 3) * 100}%` 
                          }}
                        />
                      </div>
                      
                      {/* Status Steps */}
                      <div className="relative flex justify-between">
                        {getStatusSteps(displayOrder.status).map((step, index) => (
                          <div key={step.status} className="flex flex-col items-center">
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                step.completed 
                                  ? 'bg-primary border-primary text-primary-foreground' 
                                  : step.current
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-secondary border-border text-muted-foreground'
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                getStatusIcon(step.status)
                              )}
                            </div>
                            <span className={`mt-2 text-sm font-medium ${
                              step.completed || step.current ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {step.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Items */}
                  <div className="glass-card p-6">
                    <h2 className="text-display text-xl mb-4">ORDER ITEMS</h2>
                    <div className="space-y-3">
                      {displayOrder.items.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(displayOrder.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Payment */}
                  <div className="space-y-6">
                    <div className="glass-card p-6">
                      <h2 className="text-display text-xl mb-4">SHIPPING ADDRESS</h2>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <p className="text-muted-foreground">
                          {displayOrder.shippingAddress || 'Not provided'}
                        </p>
                      </div>
                    </div>

                    <div className="glass-card p-6">
                      <h2 className="text-display text-xl mb-4">PAYMENT INFO</h2>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            displayOrder.paymentStatus === 'Paid' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {displayOrder.paymentStatus}
                          </span>
                        </div>
                        {displayOrder.paymentDetails && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Method</span>
                              <span className="capitalize">{displayOrder.paymentDetails.method.replace('_', ' ')}</span>
                            </div>
                            {displayOrder.paymentDetails.cardLast4 && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Card</span>
                                <span>•••• {displayOrder.paymentDetails.cardLast4}</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span>{new Date(displayOrder.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Orders List View */
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {userOrders.length === 0 ? (
                  <div className="glass-card p-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start shopping to see your orders here
                    </p>
                    <Button variant="hero" onClick={() => navigate('/products')}>
                      Browse Products
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  userOrders.map((order: Order, index: number) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-6 cursor-pointer hover:border-primary/50 transition-all"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(order.status)}
                            <span className="font-mono text-lg font-bold">
                              #{order.id}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-xl font-bold text-primary">
                              {formatCurrency(order.total)}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Order Items Preview */}
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 3).map((item, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-secondary/50 px-3 py-1.5 rounded-md"
                            >
                              {item.productName} x{item.quantity}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="text-xs text-muted-foreground px-3 py-1.5">
                              +{order.items.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
};

export default OrderHistory;
