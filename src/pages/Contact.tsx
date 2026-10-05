import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Clock, Send, AlertCircle, Shield } from 'lucide-react';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { contactFormSchema } from '@/lib/validations';
import { z } from 'zod';

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    try {
      contactFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: 'Message Sent!',
      description: "We'll get back to you within 24-48 hours.",
    });

    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: 'support@beastfuel.com',
      subtext: 'We reply within 24 hours',
    },
    {
      icon: Phone,
      title: 'Phone',
      details: '+1 (555) 123-4567',
      subtext: 'Mon-Fri, 9am-6pm EST',
    },
    {
      icon: MapPin,
      title: 'Address',
      details: '123 Fitness Street',
      subtext: 'New York, NY 10001',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: 'Mon-Fri: 9am-6pm',
      subtext: 'Sat-Sun: Closed',
    },
  ];

  const InputError = ({ error }: { error?: string }) => (
    error ? (
      <p className="mt-1 text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    ) : null
  );

  return (
    <Layout accent="green">
      {/* Hero */}
      <section className="relative py-16 sm:py-20 md:py-32 overflow-hidden">
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-display text-4xl sm:text-5xl md:text-7xl mb-4 sm:mb-6 text-foreground">CONTACT <span className="text-primary">US</span></h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed px-2">
              Have questions or feedback? We'd love to hear from you. Get in touch with our team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-display text-3xl md:text-4xl mb-4">Send Us a Message</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                <Shield className="h-4 w-4 text-green-500" />
                Your information is secure and will never be shared
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`bg-secondary ${errors.name ? 'border-destructive' : 'border-border'}`}
                    />
                    <InputError error={errors.name} />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`bg-secondary ${errors.email ? 'border-destructive' : 'border-border'}`}
                    />
                    <InputError error={errors.email} />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2 text-foreground">
                    Subject <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={handleChange}
                    className={`bg-secondary ${errors.subject ? 'border-destructive' : 'border-border'}`}
                  />
                  <InputError error={errors.subject} />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2 text-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more..."
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className={`bg-secondary resize-none ${errors.message ? 'border-destructive' : 'border-border'}`}
                  />
                  <InputError error={errors.message} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.message.length}/2000 characters
                  </p>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-display text-3xl md:text-4xl mb-8">Get In Touch</h2>
              <p className="text-muted-foreground mb-10 leading-relaxed">
                Whether you have questions about our products, need help with an order, or just want to 
                share your fitness journey — we're here for you.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-secondary p-6 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-display text-lg mb-1">{info.title}</h3>
                    <p className="text-foreground font-medium">{info.details}</p>
                    <p className="text-sm text-muted-foreground">{info.subtext}</p>
                  </motion.div>
                ))}
              </div>

              {/* Social Links */}
              <div className="mt-10 pt-10 border-t border-border">
                <h3 className="text-display text-xl mb-4">Follow Us</h3>
                <p className="text-muted-foreground mb-4">
                  Stay connected for the latest products, fitness tips, and exclusive offers.
                </p>
                <div className="flex gap-4">
                  {['Instagram', 'Twitter', 'Facebook', 'YouTube'].map((social) => (
                    <a
                      key={social}
                      href="#"
                      className="px-4 py-2 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      {social}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
