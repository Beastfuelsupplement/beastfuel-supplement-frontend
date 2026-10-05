import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";
import PageTransition from "@/components/PageTransition";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import OrderHistory from "./pages/OrderHistory";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const wrap = (Component: React.ComponentType) => (
  <PageTransition><Component /></PageTransition>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(Index)} />
        <Route path="/products" element={wrap(Products)} />
        <Route path="/products/:id" element={wrap(ProductDetails)} />
        <Route path="/cart" element={wrap(Cart)} />
        <Route path="/checkout" element={wrap(Checkout)} />
        <Route path="/login" element={wrap(Login)} />
        <Route path="/forgot-password" element={wrap(ForgotPassword)} />
        <Route path="/reset-password" element={wrap(ResetPassword)} />
        <Route path="/dashboard" element={wrap(Dashboard)} />
        <Route path="/order-history" element={wrap(OrderHistory)} />
        <Route path="/order-history/:orderId" element={wrap(OrderHistory)} />
        <Route path="/about" element={wrap(About)} />
        <Route path="/faq" element={wrap(FAQ)} />
        <Route path="/contact" element={wrap(Contact)} />
        <Route path="/privacy" element={wrap(Privacy)} />
        <Route path="/terms" element={wrap(Terms)} />
        <Route path="/cookies" element={wrap(Cookies)} />
        <Route path="/admin" element={wrap(AdminDashboard)} />
        <Route path="/admin/products" element={wrap(AdminProducts)} />
        <Route path="/admin/orders" element={wrap(AdminOrders)} />
        <Route path="/admin/customers" element={wrap(AdminCustomers)} />
        <Route path="/admin/settings" element={wrap(AdminSettings)} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={wrap(NotFound)} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
