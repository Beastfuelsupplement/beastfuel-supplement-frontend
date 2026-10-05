import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, ArrowLeft, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useAdminStore } from '@/store/adminStore';
import { sendCustomerOrderConfirmation } from '@/utils/customerOrderConfirmation';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { z } from 'zod';
import { 
  emailSchema, 
  nameSchema, 
  addressSchema, 
  citySchema, 
  stateSchema, 
  zipSchema,
  cardNumberSchema,
  cardExpirySchema,
  cvcSchema 
} from '@/lib/validations';

// Checkout specific validation schema
const checkoutSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  address: addressSchema,
  city: citySchema,
  state: stateSchema,
  zip: zipSchema,
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer', 'cash_on_delivery']),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user, isAuthenticated, session } = useAuth();
  const { addOrder, settings } = useAdminStore();
  const totalPrice = getTotalPrice();
  const freeShipping = totalPrice >= 50;

  const enabledPaymentMethods = settings.paymentMethods.filter(pm => pm.enabled);

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    paymentMethod: enabledPaymentMethods[0]?.type || 'card',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + ' / ' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData({ ...formData, cardNumber: formatted });
      if (errors.cardNumber) {
        setErrors({ ...errors, cardNumber: '' });
      }
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value.replace(/\s+\/\s+/g, ''));
    if (formatted.replace(/\s+\/\s+/g, '').length <= 4) {
      setFormData({ ...formData, expiry: formatted });
      if (errors.expiry) {
        setErrors({ ...errors, expiry: '' });
      }
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setFormData({ ...formData, cvc: value });
      if (errors.cvc) {
        setErrors({ ...errors, cvc: '' });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    try {
      checkoutSchema.parse({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        paymentMethod: formData.paymentMethod,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
      }
    }

    // Validate card details if card payment
    if (formData.paymentMethod === 'card') {
      try {
        cardNumberSchema.parse(formData.cardNumber);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.cardNumber = error.errors[0]?.message || 'Invalid card number';
        }
      }

      try {
        cardExpirySchema.parse(formData.expiry);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.expiry = error.errors[0]?.message || 'Invalid expiry date';
        }
      }

      try {
        cvcSchema.parse(formData.cvc);
      } catch (error) {
        if (error instanceof z.ZodError) {
          newErrors.cvc = error.errors[0]?.message || 'Invalid CVC';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderTotal = totalPrice + (freeShipping ? 0 : 9.99);
      const shippingAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`;
      const customerName = `${formData.firstName} ${formData.lastName}`;

      // Create order
      const orderId = addOrder({
        customerId: user?.id || `guest-${Date.now()}`,
        customerName,
        customerEmail: formData.email,
        items: orderItems,
        total: orderTotal,
        status: 'Pending',
        paymentStatus: formData.paymentMethod === 'cash_on_delivery' ? 'Pending' : 'Paid',
        paymentDetails: {
          method: formData.paymentMethod as 'card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery',
          cardLast4: formData.paymentMethod === 'card' ? formData.cardNumber.replace(/\s/g, '').slice(-4) : undefined,
          cardBrand: formData.paymentMethod === 'card' ? 'Visa' : undefined,
          transactionId: `txn_${Date.now()}`,
          paidAt: formData.paymentMethod !== 'cash_on_delivery' ? new Date().toISOString().split('T')[0] : undefined,
        },
        shippingAddress,
      });

      // Send customer order confirmation email (with auth token)
      if (settings.emailNotifications) {
        sendCustomerOrderConfirmation({
          orderId,
          customerName,
          customerEmail: formData.email,
          items: orderItems,
          total: orderTotal,
          shippingAddress,
          storeName: settings.storeName,
          accessToken: session?.access_token,
        }).catch(err => {
          console.error("Failed to send order confirmation email:", err);
        });
      }

      toast.success(`Order ${orderId} placed successfully!`);
      clearCart();
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout accent="purple">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-display text-4xl mb-4">NO ITEMS TO CHECKOUT</h1>
          <p className="text-muted-foreground mb-8">Add some products to your cart first.</p>
          <Link to="/products">
            <Button variant="hero" size="lg">Browse Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const InputError = ({ error }: { error?: string }) => (
    error ? (
      <p className="mt-1 text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    ) : null
  );

  return (
    <Layout accent="purple">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-display text-4xl md:text-5xl mb-4">SECURE CHECKOUT</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Complete your order with our secure payment system
            </p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-blue-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-violet-500" />
                <span>PCI Compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Link>

        {!isAuthenticated && (
          <div className="mb-8 p-4 bg-secondary rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <Link to="/login" className="text-foreground underline hover:no-underline">Sign in</Link> for a faster checkout experience and to track your orders.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-display text-xl mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                  CONTACT
                </h2>
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.email ? 'border-destructive' : 'border-border'}`}
                />
                <InputError error={errors.email} />
              </div>

              {/* Shipping */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-display text-xl mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                  SHIPPING
                </h2>
                <div className="grid gap-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.firstName ? 'border-destructive' : 'border-border'}`}
                      />
                      <InputError error={errors.firstName} />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.lastName ? 'border-destructive' : 'border-border'}`}
                      />
                      <InputError error={errors.lastName} />
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.address ? 'border-destructive' : 'border-border'}`}
                    />
                    <InputError error={errors.address} />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.city ? 'border-destructive' : 'border-border'}`}
                      />
                      <InputError error={errors.city} />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.state ? 'border-destructive' : 'border-border'}`}
                      />
                      <InputError error={errors.state} />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="zip"
                        placeholder="ZIP code"
                        value={formData.zip}
                        onChange={handleChange}
                        className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.zip ? 'border-destructive' : 'border-border'}`}
                      />
                      <InputError error={errors.zip} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-display text-xl mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                  PAYMENT METHOD
                </h2>
                <div className="space-y-3">
                  {enabledPaymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 bg-secondary border rounded-lg cursor-pointer transition-all ${
                        formData.paymentMethod === method.type
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.type}
                        checked={formData.paymentMethod === method.type}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card Details (show only for card payment) */}
              {formData.paymentMethod === 'card' && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="text-display text-xl mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">4</span>
                    CARD DETAILS
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground mb-4 p-3 bg-green-500/10 rounded-lg">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400">Your payment info is encrypted and secure</span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={handleCardNumberChange}
                        className={`w-full h-12 pl-12 pr-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.cardNumber ? 'border-destructive' : 'border-border'}`}
                      />
                    </div>
                    <InputError error={errors.cardNumber} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="text"
                          name="expiry"
                          placeholder="MM / YY"
                          value={formData.expiry}
                          onChange={handleExpiryChange}
                          className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.expiry ? 'border-destructive' : 'border-border'}`}
                        />
                        <InputError error={errors.expiry} />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="cvc"
                          placeholder="CVC"
                          value={formData.cvc}
                          onChange={handleCvcChange}
                          className={`w-full h-12 px-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.cvc ? 'border-destructive' : 'border-border'}`}
                        />
                        <InputError error={errors.cvc} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button variant="hero" size="xl" type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : `Place Order - ${formatCurrency(totalPrice + (freeShipping ? 0 : 9.99))}`}
              </Button>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="text-display text-2xl mb-6">ORDER SUMMARY</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.weight}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={freeShipping ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>{freeShipping ? '✓ FREE' : formatCurrency(9.99)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPrice + (freeShipping ? 0 : 9.99))}</span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <Shield className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                    <p className="text-[10px] text-muted-foreground">Secure</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Lock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-[10px] text-muted-foreground">Encrypted</p>
                  </div>
                  <div className="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    <CheckCircle className="h-5 w-5 mx-auto mb-1 text-violet-500" />
                    <p className="text-[10px] text-muted-foreground">Protected</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
