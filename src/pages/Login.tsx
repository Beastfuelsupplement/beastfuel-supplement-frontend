import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { loginFormSchema, registerFormSchema } from '@/lib/validations';
import { z } from 'zod';

const Login = () => {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  // Update password strength indicators
  useEffect(() => {
    if (!isLogin) {
      setPasswordStrength({
        hasMinLength: formData.password.length >= 8,
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
      });
    }
  }, [formData.password, isLogin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = (): boolean => {
    try {
      if (isLogin) {
        loginFormSchema.parse({
          email: formData.email,
          password: formData.password,
        });
      } else {
        registerFormSchema.parse({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });
      }
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

    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          toast.success('Logged in successfully!');
        } else {
          toast.error(result.error || 'Login failed');
        }
      } else {
        const result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
          toast.success('Account created successfully!');
        } else {
          toast.error(result.error || 'Registration failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout accent="blue">
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  const PasswordStrengthIndicator = () => (
    <div className="mt-3 p-4 bg-muted/50 rounded-lg space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Password Requirements
      </p>
      <div className="grid gap-1.5 text-xs">
        {[
          { check: passwordStrength.hasMinLength, text: 'At least 8 characters' },
          { check: passwordStrength.hasUppercase, text: 'One uppercase letter' },
          { check: passwordStrength.hasLowercase, text: 'One lowercase letter' },
          { check: passwordStrength.hasNumber, text: 'One number' },
          { check: passwordStrength.hasSpecial, text: 'One special character (!@#$%^&*)' },
        ].map((item, idx) => (
          <div key={idx} className={`flex items-center gap-2 ${item.check ? 'text-green-500' : 'text-muted-foreground'}`}>
            {item.check ? <CheckCircle className="h-3 w-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
            {item.text}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Layout accent="blue">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col items-center mb-4">
              <img 
                src="/beastfuel-logo.png" 
                alt="BEASTFUEL Supplements" 
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-contain bg-black border border-border/40 shadow-lg mb-3"
              />
              <span className="text-display text-5xl md:text-7xl tracking-[0.16em] font-black text-foreground" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>BEASTFUEL</span>
              <span className="text-[0.6rem] md:text-xs tracking-[0.35em] uppercase text-muted-foreground font-medium" style={{ fontFamily: "'Inter', sans-serif" }}>Supplements</span>
            </div>
            <h1 className="text-display text-3xl md:text-5xl mb-4">
              {isLogin ? 'WELCOME BACK' : 'JOIN US'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {isLogin
                ? 'Sign in to access your account and continue your fitness journey'
                : 'Create an account to unlock exclusive deals and track your orders'}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Secure Authentication</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full h-12 pl-12 pr-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.name ? 'border-destructive' : 'border-border'}`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full h-12 pl-12 pr-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.email ? 'border-destructive' : 'border-border'}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full h-12 pl-12 pr-12 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.password ? 'border-destructive' : 'border-border'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                {!isLogin && formData.password && <PasswordStrengthIndicator />}
                {isLogin && (
                  <div className="text-right">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full h-12 pl-12 pr-4 bg-secondary border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.confirmPassword ? 'border-destructive' : 'border-border'}`}
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <Button variant="hero" size="xl" type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <Button
              type="button"
              variant="outline"
              size="xl"
              className="w-full"
              disabled={isLoading || isGoogleLoading}
              onClick={async () => {
                setIsGoogleLoading(true);
                const result = await loginWithGoogle();
                if (!result.success) {
                  toast.error(result.error || 'Google login failed');
                  setIsGoogleLoading(false);
                }
              }}
            >
              {isGoogleLoading ? (
                'Connecting...'
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <p className="text-center mt-6 text-muted-foreground">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({ email: '', password: '', confirmPassword: '', name: '' });
                }}
                className="ml-2 text-foreground font-medium hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              SSL Encrypted
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Secure Login
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Login;
