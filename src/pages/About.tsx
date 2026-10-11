import { motion } from 'framer-motion';
import { 
  Award, 
  Shield, 
  Leaf, 
  Users, 
  Target, 
  Rocket, 
  Heart, 
  Zap, 
  Sparkles, 
  Globe, 
  CheckCircle, 
  Lock, 
  PackageCheck, 
  Thermometer, 
  ArrowRight 
} from 'lucide-react';
import Layout from '@/components/layout/Layout';

const About = () => {
  const values = [
    {
      icon: Award,
      title: 'Quality First',
      description: 'Every product is authenticated, sealed, and verified for peak purity and potency.',
    },
    {
      icon: Shield,
      title: 'Total Transparency',
      description: 'Full label honesty, visible batch numbers, and zero hidden fillers or proprietary tricks.',
    },
    {
      icon: Leaf,
      title: 'Clean Nutrition',
      description: 'Only trusted athletic formulas free from banned substances and harmful additives.',
    },
    {
      icon: Users,
      title: 'Athlete Community',
      description: 'Built by fitness enthusiasts, for athletes. We only sell products we personally use and trust.',
    },
  ];

  const stats = [
    { value: '100%', label: 'Authentic Imports' },
    { value: '0%', label: 'Tolerance For Fakes' },
    { value: '4.9★', label: 'Athlete Satisfaction' },
    { value: '24/7', label: 'Customer Support' },
  ];

  // Startup-appropriate authenticity pillars replacing outdated/fake corporate milestones
  const authenticityPillars = [
    {
      step: '01',
      title: 'Direct Brand Sourcing',
      badge: 'Official Channels',
      icon: Globe,
      color: 'from-amber-500 to-orange-500',
      description: 'We procure stock directly through authorized international distributors for Optimum Nutrition, MuscleTech, Dymatize, and Cellucor. No grey-market brokers, ever.',
    },
    {
      step: '02',
      title: 'Factory Seals & Batch Verification',
      badge: '100% Tamper Proof',
      icon: PackageCheck,
      color: 'from-orange-500 to-rose-500',
      description: 'Every tub, bottle, and box arrives with manufacturer security seals, authentic scratch codes, and verifiable batch numbers you can confirm with the brand.',
    },
    {
      step: '03',
      title: 'Climate-Controlled Warehousing',
      badge: 'Potency Protected',
      icon: Thermometer,
      color: 'from-rose-500 to-purple-500',
      description: 'Supplements are stored in strictly temperature-regulated environments to safeguard delicate whey protein microfractions, creatine crystals, and active amino peptides.',
    },
    {
      step: '04',
      title: 'Guaranteed Fresh Expiry Dates',
      badge: 'Fresh Stock Always',
      icon: Lock,
      color: 'from-purple-500 to-indigo-500',
      description: 'We do not sell near-expiry clearance lots. Every product delivered to you has generous shelf life remaining so you get maximum potency from the first scoop to the last.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <Layout accent="purple">
      {/* Hero Section */}
      <section className="relative min-h-[65vh] sm:min-h-[75vh] flex items-center justify-center overflow-hidden section-gray-0 section-spotlight">
        <div className="ambient-beam" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-white/70 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none ambient-glow-aura" />
        
        <div className="relative container mx-auto px-4 py-20 sm:py-28 z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 mb-6 text-xs sm:text-sm uppercase tracking-[0.2em] bg-card text-foreground font-bold rounded-full border border-border/80 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              100% Authentic Sports Nutrition
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-6 text-foreground leading-[0.9]"
            >
              OUR <span className="text-stroke font-black">STORY</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto px-4"
            >
              Founded by fitness enthusiasts who grew frustrated by counterfeit supplements, 
              inflated markups, and zero transparency. BEASTFUEL was built to be your most trusted destination 
              for certified, authentic athletic nutrition.
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-border/80 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-foreground rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 section-gray-1 border-y border-border/80 relative overflow-hidden">
        <div className="ambient-beam" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 sm:p-6"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-primary dark:text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary dark:bg-card rounded-full text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-6 font-semibold border border-border/60">
                <Target className="w-4 h-4 text-primary" />
                Our Mission
              </span>
              <h2 className="text-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-[0.95]">
                FUEL YOUR
                <br />
                <span className="text-muted-foreground">POTENTIAL</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
                We believe every athlete, gym-goer, and health enthusiast deserves genuine supplements without guesswork. 
                Our mission is to eliminate counterfeits and bring you verified, world-class athletic nutrition at fair, honest prices.
              </p>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                Every product listed on our store comes with verifiable provenance. We never cut corners, 
                we never sell questionable batches, and we stand 100% behind what we deliver.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Zap, text: 'Fast Nationwide Delivery' },
                  { icon: Heart, text: 'Athlete-First Service' },
                  { icon: Rocket, text: 'Peak Formulation Purity' },
                  { icon: Shield, text: '100% Verified Authentic' },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3.5 bg-secondary/60 dark:bg-card rounded-xl border border-border/70"
                  >
                    <item.icon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-elegant border border-border/50">
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
                  alt="Gym Athlete Training"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating Startup Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -left-6 sm:left-6 bg-card p-4 sm:p-6 rounded-2xl shadow-xl border border-border/80 backdrop-blur-md"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-xl sm:text-2xl font-display font-bold text-foreground">100% Genuine</span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground font-medium">Original Factory Sealed Stock</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The BEASTFUEL Standard / Authenticity Promise (Startup tailored) */}
      <section className="py-20 sm:py-28 section-gray-1 border-y border-border/80 relative overflow-hidden">
        <div className="ambient-beam" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/70 dark:bg-white/5 rounded-full blur-3xl pointer-events-none ambient-glow-aura" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-14 sm:mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border/80 text-xs sm:text-sm uppercase tracking-widest text-foreground font-bold mb-4 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-primary" />
              The BEASTFUEL Standard
            </div>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground font-bold tracking-tight mb-4">
              OUR AUTHENTICITY PROMISE
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              In an industry plagued by unverified sellers and watered-down formulas, 
              here is exactly how we ensure every product you receive is 100% genuine and safe.
            </p>
          </motion.div>

          {/* Authenticity Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {authenticityPillars.map((pillar, index) => {
              const PillarIcon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group relative p-6 sm:p-8 rounded-2xl bg-card border border-border/80 hover:border-primary/50 lighting-card shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  {/* Top colored accent line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${pillar.color}`} />

                  {/* Header badges */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-secondary/80 border border-border/70">
                      STEP {pillar.step}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {pillar.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-11 h-11 rounded-xl bg-secondary dark:bg-secondary/70 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <PillarIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
                      {pillar.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 md:py-32 section-gray-0 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-card rounded-full text-xs sm:text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4 border border-border/80 shadow-sm">
              What We Stand For
            </span>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-foreground">
              OUR CORE VALUES
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="group p-6 sm:p-8 rounded-2xl text-center bg-card border border-border/80 dark:border-border/60 hover:border-foreground/30 lighting-card shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <value.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <h3 className="text-display text-lg sm:text-xl mb-3 sm:mb-4 text-foreground">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary dark:bg-card" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-display text-3xl sm:text-4xl md:text-6xl mb-6 text-primary-foreground dark:text-foreground leading-[0.95]">
              READY TO FUEL YOUR
              <br />
              <span className="text-primary-foreground/70 dark:text-primary">FULL POTENTIAL?</span>
            </h2>
            <p className="text-base sm:text-lg text-primary-foreground/80 dark:text-muted-foreground mb-8 max-w-xl mx-auto">
              Shop 100% authentic, lab-tested supplements imported from the world's most trusted brands.
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-foreground dark:bg-primary text-primary dark:text-primary-foreground px-8 py-4 rounded-xl font-bold text-sm sm:text-base hover:opacity-90 transition-all shadow-xl hover:gap-3"
            >
              Explore Products
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
