import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Cookie, Mail } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const Privacy = () => {
  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our newsletter, or contact us for support. This may include:
      
• Personal information (name, email address, phone number)
• Shipping and billing addresses
• Payment information (processed securely through our payment providers)
• Order history and preferences
• Communications with our support team`
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: `We use the information we collect to:
      
• Process and fulfill your orders
• Send order confirmations and shipping updates
• Provide customer support
• Send promotional communications (with your consent)
• Improve our products and services
• Prevent fraud and maintain security
• Comply with legal obligations`
    },
    {
      icon: Shield,
      title: 'Information Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
      
• SSL encryption for all data transmission
• Secure payment processing through PCI-compliant providers
• Regular security audits and updates
• Access controls for employee data access
• Secure data storage practices`
    },
    {
      icon: Cookie,
      title: 'Cookies and Tracking',
      content: `We use cookies and similar technologies to:
      
• Remember your preferences and shopping cart
• Analyze site traffic and usage patterns
• Personalize your shopping experience
• Serve relevant advertisements
      
You can control cookie preferences through your browser settings.`
    },
    {
      icon: Lock,
      title: 'Your Rights',
      content: `You have the right to:
      
• Access your personal information
• Correct inaccurate data
• Request deletion of your data
• Opt-out of marketing communications
• Export your data in a portable format
      
To exercise these rights, please contact us at privacy@beastfuel.com.`
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: `If you have any questions about this Privacy Policy or our data practices, please contact us:
      
Email: privacy@beastfuel.com
Address: 123 Fitness Street, New York, NY 10001
Phone: +1 (555) 123-4567

We will respond to your inquiry within 30 days.`
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
              PRIVACY POLICY
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed px-2">
              Your privacy is important to us. This policy outlines how we collect, use, and protect your information.
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

export default Privacy;
