import React from 'react';

export interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * 'auto': Uses dark logo in light mode and light logo in dark mode
   * 'light': Forces white logo (e.g. for forced dark containers)
   * 'dark': Forces dark logo (e.g. for forced light containers)
   */
  variant?: 'auto' | 'light' | 'dark';
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'auto',
  className = 'h-10 sm:h-11 w-auto',
  alt = 'BEASTFUEL Supplements',
  ...props
}) => {
  if (variant === 'light') {
    return (
      <img
        src="/beastfuel-logo-light.png"
        alt={alt}
        className={`object-contain bg-transparent border-0 select-none ${className}`}
        {...props}
      />
    );
  }

  if (variant === 'dark') {
    return (
      <img
        src="/beastfuel-logo-dark.png"
        alt={alt}
        className={`object-contain bg-transparent border-0 select-none ${className}`}
        {...props}
      />
    );
  }

  // Automatic: Switches seamlessly according to the theme class on <html>
  // In Light mode: Shows dark logo with bold, high-contrast SUPPLEMENTS
  // In Dark mode: Shows light logo with bold, high-contrast SUPPLEMENTS
  return (
    <span className="inline-flex items-center bg-transparent">
      <img
        src="/beastfuel-logo-dark.png"
        alt={alt}
        className={`block dark:hidden object-contain bg-transparent border-0 select-none ${className}`}
        {...props}
      />
      <img
        src="/beastfuel-logo-light.png"
        alt={alt}
        className={`hidden dark:block object-contain bg-transparent border-0 select-none ${className}`}
        {...props}
      />
    </span>
  );
};

export default BrandLogo;
