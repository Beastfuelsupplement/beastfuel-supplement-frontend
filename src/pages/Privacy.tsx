import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Cookie, Mail, Scale, FileText, CheckCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useSettings } from '@/hooks/useSettings';

const Privacy = () => {
  const { settings } = useSettings();
  const contactEmail = settings.storeEmail?.trim() || 'supportbeastfuelsupplement@gmail.com';
  const contactPhone = settings.storePhone?.trim() || '+44 20 7946 0912';
  const contactAddress = settings.storeAddress?.trim() || 'BEASTFUEL Supplements Ltd, London, England, United Kingdom';
  const storeName = settings.storeName?.trim() || 'BEASTFUEL Supplements';

  const sections = [
    {
      icon: Scale,
      title: '1. Legal Basis & UK GDPR Compliance',
      content: `This Privacy Policy outlines how ${storeName} ("we", "us", or "our") collects, holds, and processes personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018 (DPA 2018), and the Privacy and Electronic Communications Regulations (PECR).

We process your personal information under the following lawful bases:
• Performance of a Contract: To process, pack, and deliver your orders, manage your customer account, and process payments.
• Legal Obligation: To maintain financial, tax, and sales records required by HM Revenue & Customs (HMRC) and UK statutory bodies.
• Legitimate Interests: To detect and prevent fraud, optimize website performance, protect cybersecurity, and improve customer service.
• Consent: Where you have given explicit consent, such as opting in to our email newsletter or non-essential cookies. You may withdraw consent at any time.`
    },
    {
      icon: Database,
      title: '2. Information We Collect',
      content: `We collect and process only the personal data necessary to provide you with high-quality service:

• Contact & Identity Data: Your full name, delivery address, billing address, email address, and contact telephone number.
• Transaction & Order Data: Items purchased, order dates, payment references, order totals in British Pound Sterling (GBP), and customer notes.
• Payment Security Data: Card and payment details are processed directly through certified PCI-DSS compliant payment providers (such as Stripe or PayPal). We never store complete credit card or debit card numbers on our servers.
• Technical & Usage Data: IP address, device type, browser specifications, operating system, and on-site navigation paths via essential cookies.`
    },
    {
      icon: Eye,
      title: '3. How We Use Your Data',
      content: `Your personal information is used strictly for legitimate business operations:

• Fulfilling and shipping your supplement orders with tracked courier partners.
• Sending order confirmations, dispatch notices, and tracking numbers.
• Providing responsive customer support and managing returns or queries.
• Processing refunds and replacements under our 7-Day Return Policy.
• Safeguarding against fraudulent transactions and verifying checkout security.
• Sending promotional offers and fitness updates only when you have explicitly subscribed.`
    },
    {
      icon: Shield,
      title: '4. Data Security & Storage',
      content: `We employ strict technical and organizational safeguards to keep your personal data secure:

• 256-bit SSL/TLS encryption for all data submitted through our checkout and portal.
• Strict role-based access controls limiting data access solely to authorized personnel.
• Regular system maintenance, vulnerability assessments, and dependency auditing.
• Secure, certified cloud hosting infrastructure compliant with ISO 27001 standards.`
    },
    {
      icon: FileText,
      title: '5. Data Retention Period',
      content: `We only retain your personal data for as long as necessary to fulfil the purposes we collected it for:

• Order & Transaction Records: Retained for up to 6 years following the end of the relevant financial year in compliance with UK HMRC statutory accounting rules.
• Customer Account Details: Retained for the active duration of your account, or until you request account closure.
• Marketing Communications: Retained until you click "Unsubscribe" or withdraw marketing consent.`
    },
    {
      icon: Cookie,
      title: '6. Cookies and Tracking Technologies',
      content: `Our website utilizes cookies and similar local storage technologies:

• Strictly Necessary Cookies: Essential for cart operation, session persistence, and secure checkout.
• Analytical / Performance Cookies: Help us gauge site traffic, popular products, and technical stability anonymously.
• Marketing Cookies: Used only with your prior consent to deliver relevant offers.

You can manage or disable cookies at any time via your browser settings. For full details, see our Cookie Policy.`
    },
    {
      icon: Lock,
      title: '7. Your Rights Under UK GDPR',
      content: `As an individual in the United Kingdom, you hold strong statutory rights regarding your personal data:

• Right of Access (Subject Access Request): You can request a free copy of the personal information we hold about you.
• Right to Rectification: You may request immediate correction of inaccurate or incomplete data.
• Right to Erasure ("Right to be Forgotten"): You may request deletion of your personal data where retention is no longer legally required.
• Right to Restriction of Processing: You can request that we pause processing your data under certain circumstances.
• Right to Data Portability: You have the right to receive your personal data in a structured, machine-readable format.
• Right to Object: You can object at any time to direct marketing or processing based on legitimate interests.
• Right to Lodge a Complaint: If you believe your data has been mishandled, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk or by calling 0303 123 1113.`
    },
    {
      icon: Mail,
      title: '8. Contact Us & Data Protection Officer',
      content: `To exercise any of your statutory rights, make a Subject Access Request, or ask questions about our data practices:

Email: ${contactEmail}
Address: ${contactAddress}
Phone: ${contactPhone}

We respond to all verified data subject requests without undue delay and at the latest within one calendar month in accordance with UK GDPR statutory timelines.`
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
              Your privacy and personal data protection are paramount. This policy explains our data practices under UK GDPR and English law.
            </p>
            <p className="text-sm text-primary-foreground/60 mt-4">
              Governing Law: England & Wales • Last updated: January 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-10">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm hover:border-primary/40 transition-colors"
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
