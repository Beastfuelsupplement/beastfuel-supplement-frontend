import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      category: 'Orders & Shipping',
      questions: [
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping typically takes 5-7 business days. Express shipping is available for 2-3 business day delivery. International orders may take 10-14 business days depending on destination.',
        },
        {
          question: 'Do you offer free shipping?',
          answer: 'Yes! We offer free standard shipping on all orders over $75. Orders under $75 have a flat rate shipping fee of $5.99.',
        },
        {
          question: 'Can I track my order?',
          answer: 'Absolutely! Once your order ships, you\'ll receive an email with tracking information. You can also track your order through your account dashboard.',
        },
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day satisfaction guarantee. If you\'re not completely satisfied with your purchase, contact us for a full refund or exchange. Products must be unopened and in original packaging.',
        },
      ],
    },
    {
      category: 'Products',
      questions: [
        {
          question: 'Are your products tested for quality?',
          answer: 'Yes, all BEASTFUEL products undergo rigorous third-party testing for purity, potency, and safety. We provide certificates of analysis for all our products upon request.',
        },
        {
          question: 'Are your supplements suitable for vegans?',
          answer: 'Many of our products are vegan-friendly. Check the product description and ingredient list for vegan certification. Look for the "Vegan" badge on qualifying products.',
        },
        {
          question: 'How should I store my supplements?',
          answer: 'Store supplements in a cool, dry place away from direct sunlight. Keep containers tightly sealed. Some products may require refrigeration after opening — check the label for specific instructions.',
        },
        {
          question: 'When is the best time to take supplements?',
          answer: 'Timing depends on the supplement type. Pre-workouts should be taken 20-30 minutes before exercise. Protein can be consumed anytime, but is most beneficial post-workout. Check each product\'s instructions for optimal timing.',
        },
      ],
    },
    {
      category: 'Account & Payments',
      questions: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. All transactions are encrypted and secure.',
        },
        {
          question: 'How do I create an account?',
          answer: 'Click the "Login" button in the navigation bar and select "Create Account". You can also create an account during checkout. Having an account lets you track orders and save your preferences.',
        },
        {
          question: 'Is my personal information secure?',
          answer: 'Absolutely. We use industry-standard SSL encryption to protect your data. We never share your personal information with third parties for marketing purposes.',
        },
      ],
    },
  ];

  return (
    <Layout accent="rose">
      {/* Hero */}
      <section className="py-16 sm:py-20 md:py-32 bg-primary dark:bg-primary/90">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 text-primary-foreground">FAQ</h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed px-2">
              Find answers to commonly asked questions about our products, orders, and more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-4xl">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
              className="mb-12 last:mb-0"
            >
              <h2 className="text-display text-2xl md:text-3xl mb-6 text-foreground">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-4">
                {category.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${categoryIndex}-${index}`}
                    className="bg-secondary/50 rounded-lg px-6 border-none"
                  >
                    <AccordionTrigger className="text-left text-foreground hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-16 sm:py-20 bg-secondary dark:bg-secondary/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-display text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4 text-foreground">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base px-2">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              Contact Us
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
