import { motion } from 'framer-motion';
import { FileText, ShoppingCart, CreditCard, Truck, RotateCcw, AlertCircle, Scale } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const Terms = () => {
  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: `By accessing and using the BEASTFUEL website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

These terms apply to all visitors, users, and customers who access or use our website.`
    },
    {
      icon: ShoppingCart,
      title: 'Products and Orders',
      content: `• All products are subject to availability
• We reserve the right to limit quantities
• Prices are subject to change without notice
• Product descriptions are accurate to the best of our knowledge
• Colors may vary slightly from images due to monitor settings
• We reserve the right to cancel orders if product information is inaccurate

Orders are binding once confirmed. We will send an email confirmation upon order placement.`
    },
    {
      icon: CreditCard,
      title: 'Payment Terms',
      content: `• Payment is due at the time of order
• We accept major credit cards, PayPal, and bank transfers
• All transactions are processed in USD
• Prices include applicable taxes unless otherwise stated
• Payment information is encrypted and processed securely
• Failed payments may result in order cancellation`
    },
    {
      icon: Truck,
      title: 'Shipping Policy',
      content: `• Orders are processed within 1-2 business days
• Free shipping on orders over Rs. 50
• Standard shipping: 5-7 business days
• Express shipping: 2-3 business days
• International shipping may take 10-14 business days
• Tracking information will be provided via email
• BEASTFUEL is not responsible for delays caused by carriers or customs`
    },
    {
      icon: RotateCcw,
      title: 'Returns and Refunds',
      content: `• 30-day satisfaction guarantee on all products
• Products must be unopened and in original packaging
• Return shipping costs are the customer's responsibility
• Refunds are processed within 5-7 business days
• Original shipping costs are non-refundable
• Damaged or defective products will be replaced at no cost

To initiate a return, contact our customer support team.`
    },
    {
      icon: AlertCircle,
      title: 'Limitation of Liability',
      content: `BEASTFUEL supplements are intended for healthy adults over 18 years of age. Consult a healthcare professional before use if you have any medical conditions or are taking medications.

• BEASTFUEL is not liable for misuse of products
• Results may vary between individuals
• We are not responsible for allergic reactions to disclosed ingredients
• Maximum liability is limited to the purchase price of the product`
    },
    {
      icon: Scale,
      title: 'Governing Law',
      content: `These Terms of Service are governed by the laws of the State of New York, United States. Any disputes arising from these terms shall be resolved in the courts of New York County.

By using our services, you consent to this jurisdiction and venue.`
    }
  ];

  return (
    <Layout accent="rose">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-32 bg-primary dark:bg-primary/90">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 text-primary-foreground">
              TERMS OF SERVICE
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed px-2">
              Please read these terms carefully before using our website and services.
            </p>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Last updated: January 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-display text-xl sm:text-2xl mb-4 text-foreground">
                      {section.title}
                    </h2>
                    <div className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm sm:text-base">
                      {section.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;
