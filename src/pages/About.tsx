import { motion } from 'framer-motion';
import { Award, Shield, Leaf, Users, Target, Rocket, Heart, Zap } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const About = () => {
  const values = [
    {
      icon: Award,
      title: 'Quality First',
      description: 'Every product is lab-tested and certified for purity and potency.',
    },
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Full ingredient disclosure and third-party verification on all products.',
    },
    {
      icon: Leaf,
      title: 'Clean Ingredients',
      description: 'No artificial colors, flavors, or unnecessary fillers in our formulas.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Built by athletes, for athletes. We understand your needs.',
    },
  ];

  const stats = [
    { value: '50K+', label: 'Athletes Trust Us' },
    { value: '99%', label: 'Purity Guaranteed' },
    { value: '4.9', label: 'Customer Rating' },
    { value: '24/7', label: 'Support Available' },
  ];

  const milestones = [
    { year: '2019', title: 'Founded', description: 'BEASTFUEL was born from a vision to revolutionize sports nutrition.' },
    { year: '2020', title: 'First Product Launch', description: 'Launched our flagship protein line to overwhelming response.' },
    { year: '2022', title: '50K Athletes', description: 'Reached a milestone of 50,000 athletes trusting our products.' },
    { year: '2024', title: 'Global Expansion', description: 'Expanded to serve athletes in over 25 countries worldwide.' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout accent="purple">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="relative container mx-auto px-4 py-20 sm:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            <motion.span 
              variants={itemVariants}
              className="inline-block px-4 sm:px-6 py-2 mb-6 text-xs sm:text-sm uppercase tracking-[0.2em] bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary rounded-full border border-primary/20 dark:border-primary/20"
            >
              Since 2019
            </motion.span>
            
            <motion.div variants={itemVariants} className="flex flex-col items-center mb-6">
              <img 
                src="/beastfuel-logo.png" 
                alt="BEASTFUEL Supplements" 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl object-contain bg-black border border-border/50 shadow-2xl mb-4"
              />
              <span className="text-display text-5xl sm:text-6xl md:text-7xl tracking-[0.16em] font-black text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>BEASTFUEL</span>
              <span className="text-[0.6rem] sm:text-xs md:text-sm tracking-[0.35em] uppercase text-muted-foreground font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Supplements</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-6 text-foreground dark:text-foreground leading-[0.9]"
            >
              OUR <span className="text-primary dark:text-primary">STORY</span>
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg md:text-xl text-muted-foreground dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto px-4"
            >
              Born from a passion for fitness and a frustration with subpar supplements, 
              BEASTFUEL was created to give athletes what they deserve — clean, effective, 
              and scientifically-backed nutrition.
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-primary/30 dark:border-primary/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-1.5 bg-primary dark:bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-secondary dark:bg-card border-y border-border">
        <div className="container mx-auto px-4">
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
                <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
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
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary dark:bg-card rounded-full text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-6">
                <Target className="w-4 h-4" />
                Our Mission
              </span>
              <h2 className="text-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 text-foreground leading-[0.95]">
                FUEL YOUR
                <br />
                <span className="text-muted-foreground">POTENTIAL</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">
                We believe that everyone deserves access to premium supplements without compromise. 
                Our mission is to provide the highest quality products that help you achieve your 
                fitness goals, whether you're a professional athlete or just starting your journey.
              </p>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                Every formula is developed with input from nutritionists, athletes, and scientists 
                to ensure maximum effectiveness. We never cut corners — only results matter.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Zap, text: 'Fast Results' },
                  { icon: Heart, text: 'Health Focused' },
                  { icon: Rocket, text: 'Peak Performance' },
                  { icon: Shield, text: 'Lab Tested' },
                ].map((item, i) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-secondary dark:bg-card rounded-lg border border-border"
                  >
                    <item.icon className="w-5 h-5 text-primary dark:text-primary" />
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
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
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-elegant">
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80"
                  alt="Gym Training"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -left-6 sm:left-6 bg-card dark:bg-card p-4 sm:p-6 rounded-xl shadow-card border border-border"
              >
                <div className="text-3xl sm:text-4xl font-display font-bold text-primary dark:text-primary">5+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Years of Excellence</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-secondary/50 dark:bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-background dark:bg-background rounded-full text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-4">
              Our Journey
            </span>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-foreground">MILESTONES</h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`flex items-start gap-4 sm:gap-8 mb-8 sm:mb-12 ${index % 2 === 1 ? 'md:flex-row-reverse md:text-right' : ''}`}
              >
                <div className="flex-shrink-0 w-16 sm:w-20 h-16 sm:h-20 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground rounded-xl flex items-center justify-center text-lg sm:text-xl font-display font-bold shadow-card">
                  {milestone.year}
                </div>
                <div className="flex-1 p-4 sm:p-6 bg-background dark:bg-background rounded-xl border border-border shadow-card">
                  <h3 className="text-display text-lg sm:text-xl text-foreground mb-2">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-24 md:py-32 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block px-4 py-2 bg-secondary dark:bg-card rounded-full text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-4">
              What We Stand For
            </span>
            <h2 className="text-display text-3xl sm:text-4xl md:text-5xl text-foreground">OUR VALUES</h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="group p-6 sm:p-8 rounded-2xl text-center bg-secondary dark:bg-card border border-border hover:border-primary/30 dark:hover:border-primary/30 transition-all duration-300 hover:shadow-card"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mx-auto mb-5 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
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
      <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
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
              READY TO JOIN THE
              <br />
              <span className="text-primary-foreground/60 dark:text-primary">BEASTFUEL FAMILY?</span>
            </h2>
            <p className="text-base sm:text-lg text-primary-foreground/80 dark:text-muted-foreground mb-8 max-w-xl mx-auto">
              Experience the difference that quality supplements can make in your fitness journey.
            </p>
            <a
              href="/products"
              className="inline-flex items-center gap-2 bg-primary-foreground dark:bg-primary text-primary dark:text-primary-foreground px-8 py-4 rounded-xl font-medium text-sm sm:text-base hover:opacity-90 transition-opacity shadow-card"
            >
              Explore Products
            </a>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
