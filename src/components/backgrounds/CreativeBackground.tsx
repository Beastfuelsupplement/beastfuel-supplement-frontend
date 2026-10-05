import { motion } from 'framer-motion';
import { useId } from 'react';

export type ColorAccent = 'default' | 'blue' | 'purple' | 'green' | 'orange' | 'rose';

interface CreativeBackgroundProps {
  accent?: ColorAccent;
}

const CreativeBackground = ({ accent = 'default' }: CreativeBackgroundProps) => {
  const uniqueId = useId();
  // Always use black/white - ignore accent prop for color
  const colorHsl = 'var(--foreground)';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - black/white only */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/30 to-background" />
      
      {/* Animated mesh gradient */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, hsl(${colorHsl} / 0.04) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, hsl(${colorHsl} / 0.03) 0%, transparent 40%),
              radial-gradient(circle at 40% 80%, hsl(${colorHsl} / 0.02) 0%, transparent 35%)
            `,
          }}
        />
      </div>

      {/* Floating orbs - subtle black/white */}
      <motion.div
        animate={{ 
          y: [0, -60, 0], 
          x: [0, 40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] right-[15%] w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(${colorHsl} / 0.06) 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />
      
      <motion.div
        animate={{ 
          y: [0, 80, 0], 
          x: [0, -50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-[5%] left-[10%] w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(${colorHsl} / 0.05) 0%, transparent 60%)`,
          filter: 'blur(50px)',
        }}
      />

      <motion.div
        animate={{ 
          y: [0, -40, 0], 
          x: [0, 30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-[40%] left-[25%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(${colorHsl} / 0.04) 0%, transparent 50%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0,
            y: '100vh',
            x: `${(i * 8) + 5}%`,
          }}
          animate={{ 
            opacity: [0, 0.4, 0.4, 0],
            y: [100, -100],
          }}
          transition={{ 
            duration: 8 + (i % 4) * 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "linear",
          }}
          className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-foreground/30"
        />
      ))}

      {/* Animated lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`lineGradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className="[stop-color:hsl(var(--foreground)/0)]" />
            <stop offset="50%" className="[stop-color:hsl(var(--foreground)/0.1)]" />
            <stop offset="100%" className="[stop-color:hsl(var(--foreground)/0)]" />
          </linearGradient>
        </defs>
        
        <motion.line
          x1="0%" y1="25%" x2="100%" y2="25%"
          stroke={`url(#lineGradient-${uniqueId})`}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
        <motion.line
          x1="0%" y1="75%" x2="100%" y2="75%"
          stroke={`url(#lineGradient-${uniqueId})`}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.8 }}
        />
      </svg>

      {/* Flowing wave shapes */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-[40%] opacity-[0.02] dark:opacity-[0.04]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 560"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,560L1392,560C1344,560,1248,560,1152,560C1056,560,960,560,864,560C768,560,672,560,576,560C480,560,384,560,288,560C192,560,96,560,48,560L0,560Z"
          className="fill-foreground"
          animate={{
            d: [
              "M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,560L1392,560C1344,560,1248,560,1152,560C1056,560,960,560,864,560C768,560,672,560,576,560C480,560,384,560,288,560C192,560,96,560,48,560L0,560Z",
              "M0,288L48,272C96,256,192,224,288,218.7C384,213,480,235,576,245.3C672,256,768,256,864,240C960,224,1056,192,1152,186.7C1248,181,1344,203,1392,213.3L1440,224L1440,560L1392,560C1344,560,1248,560,1152,560C1056,560,960,560,864,560C768,560,672,560,576,560C480,560,384,560,288,560C192,560,96,560,48,560L0,560Z",
              "M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,560L1392,560C1344,560,1248,560,1152,560C1056,560,960,560,864,560C768,560,672,560,576,560C480,560,384,560,288,560C192,560,96,560,48,560L0,560Z",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-[0.02] dark:opacity-[0.1]" />

      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Corner accents */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px]"
        style={{
          background: `radial-gradient(circle at top right, hsl(${colorHsl} / 0.03) 0%, transparent 50%)`,
        }}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 left-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px]"
        style={{
          background: `radial-gradient(circle at bottom left, hsl(${colorHsl} / 0.02) 0%, transparent 50%)`,
        }}
      />

      {/* Geometric shapes */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-[15%] right-[20%] w-16 h-16 sm:w-24 sm:h-24 rounded-lg border border-foreground/10"
        style={{ 
          transform: 'rotate(45deg)',
        }}
      />
      
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[25%] left-[15%] w-12 h-12 sm:w-20 sm:h-20 rounded-full border border-foreground/5"
      />

      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[60%] right-[30%] w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-foreground/5"
      />
    </div>
  );
};

export default CreativeBackground;
