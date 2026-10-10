import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import BackToTop from '../BackToTop';
import CreativeBackground from '../backgrounds/CreativeBackground';

interface LayoutProps {
  children: ReactNode;
  accent?: 'default' | 'blue' | 'purple' | 'green' | 'orange' | 'rose';
}

const Layout = ({ children, accent = 'default' }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global Creative Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <CreativeBackground accent={accent} />
      </div>
      <Navbar />
      <main className="flex-1 pt-[72px] sm:pt-[76px] relative z-10">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Layout;
