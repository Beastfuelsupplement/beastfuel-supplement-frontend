import { motion } from 'framer-motion';
import { 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Truck, 
  AlertTriangle, 
  CreditCard, 
  HelpCircle, 
  CheckCircle2, 
  Mail, 
  PackageCheck,
  FileCheck2,
  Scale
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ReturnPolicy = () => {
  const { settings } = useSettings();
  const contactEmail = settings.storeEmail?.trim() || 'supportbeastfuelsupplement@gmail.com';
  const contactPhone = settings.storePhone?.trim() || '+44 20 7946 0912';
  const contactAddress = settings.storeAddress?.trim() || 'BEASTFUEL Returns Centre, London, England, United Kingdom';
  const storeName = settings.storeName?.trim() || 'BEASTFUEL Supplements';

  const sections = [
    {
      icon: Clock,
      title: '1. 7-Day Satisfaction Guarantee & Return Window',
      content: `We take immense pride in the premium quality of our supplements. If you are not completely satisfied with your purchase:

• You have exactly 7 calendar days from the date of confirmed carrier delivery to notify our customer service team and request a return.
• After receiving your Return Merchandise Authorization (RMA) from our team, the return parcel must be dispatched back to our warehouse within 7 business days.
• Requests submitted after 7 calendar days from delivery will not be eligible for a refund or exchange.`
    },
    {
      icon: ShieldCheck,
      title: '2. Product Condition & Supplement Hygiene Standards',
      content: `Because we supply ingestible nutritional supplements and sports health products, strict safety and hygiene standards apply under UK Consumer Regulations:

• Items must be 100% unopened, unused, and in their pristine original condition.
• All manufacturer safety seals, neck seals, foil membranes, and tamper-evident bands must be completely intact and unbreached.
• Original tubs, pouches, bottles, packaging, labels, and outer cartons must be undamaged and in resaleable condition.
• For health and consumer protection reasons, any consumable item with a broken seal or opened packaging CANNOT be returned or refunded.`
    },
    {
      icon: AlertTriangle,
      title: '3. Non-Returnable & Final Sale Items',
      content: `The following categories are strictly non-returnable:

• Any supplement, powder, capsule, or liquid where the outer or inner safety seal has been opened or tampered with.
• Perishable products or items marked as clearance, "Special Offer", or "Final Sale".
• Gift vouchers, promotional gift cards, and complimentary promotional items or free gifts.
• Products purchased from unauthorized third-party resellers or outside our official website.`
    },
    {
      icon: PackageCheck,
      title: '4. Step-by-Step Return Process',
      content: `Follow these four simple steps to ensure a smooth, timely return:

1. Step 1 - Request Return Authorization:
   Email our support team at ${contactEmail} within 7 days of delivery. Include your Order Number, the item name(s) you wish to return, and the reason for return.
2. Step 2 - Receive RMA & Return Address:
   Our customer care team will review your request within 24 hours and issue a Return Authorization (RMA) reference number and the designated warehouse address.
3. Step 3 - Package Your Return Securely:
   Place the unopened product into a sturdy shipping box with adequate protective padding. Include your Order Number and RMA code inside the parcel.
4. Step 4 - Ship with Tracking:
   Dispatch the parcel using a reputable tracked courier (such as Royal Mail Tracked, DPD, or Evri) and email us the tracking code.`
    },
    {
      icon: Truck,
      title: '5. Return Shipping Costs',
      content: `• Change of Mind / Customer Preference: The customer is responsible for paying all return shipping postage costs.
• Proof of Postage: We strongly advise using a recorded, tracked delivery service. We cannot accept liability for return packages lost or damaged in transit before reaching our facility.
• Damaged, Defective, or Incorrect Goods: If you received a faulty or wrong item, BEASTFUEL will provide a prepaid return label or fully reimburse reasonable standard tracked return postage costs.`
    },
    {
      icon: CreditCard,
      title: '6. Inspection & Refund Timeline',
      content: `• Warehouse Inspection: Once your parcel arrives at our fulfilment depot, our quality team inspects the items within 2 to 3 business days to verify seal integrity.
• Refund Issuance: Upon successful inspection, your refund will be processed immediately.
• Timeframe: Funds typically reflect in your account within 5 to 7 business days, depending on your bank or payment provider.
• Currency: All refunds are credited in British Pound Sterling (GBP / £) directly to the original payment method used during checkout.
• Shipping Charges: Outbound shipping charges are non-refundable on change-of-mind returns.`
    },
    {
      icon: FileCheck2,
      title: '7. Damaged, Defective, or Incorrect Items',
      content: `We inspect every order before dispatch, but in the unlikely event an item arrives damaged, defective, or incorrect:

• Please notify our team within 48 hours of delivery at ${contactEmail}.
• Provide clear photos showing the damaged product, the batch/expiry code, and the outer shipping carton.
• We will promptly dispatch an expedited replacement at zero cost or issue a 100% full refund including all shipping costs.
• Statutory Rights: Nothing in this policy limits or affects your legal rights under the UK Consumer Rights Act 2015.`
    },
    {
      icon: Scale,
      title: '8. Governing Law',
      content: `This Return & Refund Policy is governed by and construed in accordance with the laws of England and Wales. 

Any disputes arising from returns, refunds, or product purchases shall be subject to the exclusive jurisdiction of the courts of England and Wales.`
    },
    {
      icon: Mail,
      title: '9. Customer Support & Assistance',
      content: `If you have questions regarding a return, refund status, or product suitability, our dedicated team is here to assist:

Email: ${contactEmail}
Phone: ${contactPhone}
Returns Address: ${contactAddress}
Operating Hours: Mon - Fri: 9:00 AM - 6:00 PM (GMT)`
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 mb-6 backdrop-blur-sm border border-primary-foreground/20">
              <RotateCcw className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 text-primary-foreground">
              RETURN & REFUND POLICY
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 leading-relaxed px-2">
              7-Day Satisfaction Guarantee on all genuine unopened supplements. Read our complete return guidelines below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-primary-foreground/70 mt-6">
              <span className="bg-primary-foreground/10 px-3 py-1 rounded-full border border-primary-foreground/15">
                7-Day Return Window
              </span>
              <span className="bg-primary-foreground/10 px-3 py-1 rounded-full border border-primary-foreground/15">
                Processed in GBP (£)
              </span>
              <span className="bg-primary-foreground/10 px-3 py-1 rounded-full border border-primary-foreground/15">
                Governing Law: England
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Summary Highlights */}
      <section className="py-12 bg-secondary/30 border-b border-border">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-base mb-1">7-Day Return Window</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Notify us within 7 calendar days of delivery for a return authorization.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-base mb-1">Sealed & Inresaleable</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Consumable supplements must be unopened with safety seals 100% intact.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <CreditCard className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-base mb-1">Fast 5-7 Day Refunds</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Refunds processed in GBP (£) to your original payment method after inspection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
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

          {/* Need help banner */}
          <div className="mt-16 bg-card border border-primary/20 rounded-2xl p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-display text-2xl mb-2 text-foreground">Ready to start a return?</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Our UK support team is here to assist with return requests and customer inquiries.
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to="/contact">
                <Button variant="hero">Contact Support</Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline">View FAQ</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReturnPolicy;

