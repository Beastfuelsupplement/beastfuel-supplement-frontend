import { motion } from 'framer-motion';
import { Cookie, Settings, BarChart, Target, Shield, ToggleLeft } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

const Cookies = () => {
  const cookieTypes = [
    {
      icon: Shield,
      title: 'Essential Cookies',
      required: true,
      description: 'These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.',
      examples: ['Session management', 'Shopping cart', 'User authentication', 'Security features']
    },
    {
      icon: Settings,
      title: 'Functional Cookies',
      required: false,
      description: 'These cookies enable personalized features and remember your preferences to provide enhanced functionality.',
      examples: ['Language preferences', 'Theme settings', 'Recently viewed products', 'Saved addresses']
    },
    {
      icon: BarChart,
      title: 'Analytics Cookies',
      required: false,
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      examples: ['Page views', 'Traffic sources', 'User behavior', 'Site performance']
    },
    {
      icon: Target,
      title: 'Marketing Cookies',
      required: false,
      description: 'These cookies are used to track visitors across websites to display relevant advertisements based on your interests.',
      examples: ['Ad personalization', 'Retargeting', 'Social media integration', 'Campaign tracking']
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
            <Cookie className="w-16 h-16 mx-auto mb-6 text-primary-foreground" />
            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 text-primary-foreground">
              COOKIE POLICY
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed px-2">
              We use cookies to enhance your browsing experience and provide personalized content.
            </p>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Last updated: January 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-12"
          >
            <h2 className="text-display text-2xl sm:text-3xl mb-4 text-foreground">
              What Are Cookies?
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and to provide information to the website owners. Cookies help us remember your preferences, understand how you use our site, and improve your overall experience.
            </p>
          </motion.div>

          {/* Cookie Types */}
          <div className="space-y-6">
            <h2 className="text-display text-2xl sm:text-3xl text-foreground text-center mb-8">
              Types of Cookies We Use
            </h2>
            
            {cookieTypes.map((cookie, index) => (
              <motion.div
                key={cookie.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <cookie.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-display text-xl text-foreground">
                        {cookie.title}
                      </h3>
                      {cookie.required && (
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {cookie.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cookie.examples.map((example) => (
                        <span
                          key={example}
                          className="px-3 py-1 text-xs bg-secondary rounded-full text-muted-foreground"
                        >
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Managing Cookies */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-xl p-6 sm:p-8 mt-12"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <ToggleLeft className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-display text-xl sm:text-2xl mb-4 text-foreground">
                  Managing Your Cookies
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
                  You can control and manage cookies in various ways. Please note that removing or blocking cookies may impact your user experience and parts of our website may no longer be fully accessible.
                </p>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>• <strong className="text-foreground">Browser Settings:</strong> Most browsers allow you to manage cookies through their settings.</p>
                  <p>• <strong className="text-foreground">Clear Cookies:</strong> You can delete cookies that have already been stored on your device.</p>
                  <p>• <strong className="text-foreground">Private Browsing:</strong> Use incognito/private mode to prevent cookies from being stored.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 p-8 bg-secondary/50 rounded-xl"
          >
            <h2 className="text-display text-xl sm:text-2xl mb-4 text-foreground">
              Questions About Cookies?
            </h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about our use of cookies, please contact us.
            </p>
            <Button variant="hero" asChild>
              <a href="/contact">Contact Us</a>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Cookies;
