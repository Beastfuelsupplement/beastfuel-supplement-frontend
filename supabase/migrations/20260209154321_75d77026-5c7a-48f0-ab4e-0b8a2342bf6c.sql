
-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image TEXT,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  description TEXT,
  weight TEXT,
  flavor TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view active products
CREATE POLICY "Anyone can view active products"
ON public.products FOR SELECT
USING (is_active = true);

-- Admins can view all products (including inactive)
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update products
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete products
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with customers
CREATE POLICY "Admins can manage customers"
ON public.customers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own customer record
CREATE POLICY "Users can view own customer record"
ON public.customers FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  payment_method TEXT,
  payment_card_last4 TEXT,
  payment_card_brand TEXT,
  payment_transaction_id TEXT,
  payment_paid_at TIMESTAMP WITH TIME ZONE,
  shipping_address TEXT,
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with orders
CREATE POLICY "Admins can manage orders"
ON public.orders FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Authenticated users can create orders (for themselves)
CREATE POLICY "Users can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Admins can manage order items
CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own order items
CREATE POLICY "Users can view own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- =============================================
-- STORE SETTINGS TABLE
-- =============================================
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage store settings
CREATE POLICY "Admins can manage store settings"
ON public.store_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can read store settings (for storefront display)
CREATE POLICY "Anyone can read store settings"
ON public.store_settings FOR SELECT
USING (true);

CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED DEFAULT PRODUCTS
-- =============================================
INSERT INTO public.products (name, price, image, category, description, weight, flavor, stock) VALUES
  ('Whey Protein Isolate', 59.99, 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&auto=format&fit=crop&q=80', 'Protein', 'Premium whey protein isolate with 27g of protein per serving. Fast-absorbing formula for optimal muscle recovery and growth. Zero added sugars and low in fat.', '2.2 lbs', 'Chocolate', 25),
  ('Pre-Workout Surge', 44.99, 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800&auto=format&fit=crop&q=80', 'Pre-Workout', 'Explosive energy formula with caffeine, beta-alanine, and citrulline. Experience intense focus and endurance for your most demanding workouts.', '300g', 'Blue Raspberry', 18),
  ('Creatine Monohydrate', 29.99, 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&auto=format&fit=crop&q=80', 'Performance', 'Pure micronized creatine monohydrate for increased strength, power, and muscle volume. 5g per serving for optimal results.', '500g', NULL, 10),
  ('BCAA Recovery', 34.99, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80', 'Recovery', 'Essential branched-chain amino acids in optimal 2:1:1 ratio. Supports muscle recovery, reduces soreness, and prevents muscle breakdown.', '400g', 'Watermelon', 30),
  ('Mass Gainer Elite', 69.99, 'https://images.unsplash.com/photo-1612532275214-e4ca76d0e4d1?w=800&auto=format&fit=crop&q=80', 'Weight Gain', 'High-calorie formula with 1250 calories and 50g protein per serving. Complex carbs and healthy fats for lean muscle gains.', '6 lbs', 'Vanilla', 15),
  ('Omega-3 Fish Oil', 24.99, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80', 'Health', 'Ultra-pure omega-3 fatty acids from wild-caught fish. Supports heart health, joint function, and cognitive performance.', '120 softgels', NULL, 50),
  ('Multivitamin Pro', 19.99, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=800&auto=format&fit=crop&q=80', 'Health', 'Complete daily vitamin and mineral formula designed for athletes. Enhanced absorption with essential micronutrients.', '90 tablets', NULL, 40),
  ('Casein Protein', 54.99, 'https://images.unsplash.com/photo-1622485831122-e4f2b33f7a2a?w=800&auto=format&fit=crop&q=80', 'Protein', 'Slow-release micellar casein for overnight muscle recovery. 24g protein per serving with sustained amino acid release.', '2 lbs', 'Cookies & Cream', 20);

-- =============================================
-- SEED DEFAULT STORE SETTINGS
-- =============================================
INSERT INTO public.store_settings (key, value) VALUES
  ('general', '{"storeName": "BEASTFUEL Supplements", "storeEmail": "contact@beastfuel.com", "storePhone": "+1 (555) 123-4567", "storeAddress": "123 Fitness Street, Gym City, GC 12345", "currency": "USD", "timezone": "America/New_York"}'::jsonb),
  ('notifications', '{"emailNotifications": true, "orderNotifications": true, "marketingEmails": false, "adminEmail": "dilmunasingha91@gmail.com", "lowStockThreshold": 10}'::jsonb),
  ('security', '{"twoFactorAuth": false, "sessionTimeout": "60"}'::jsonb);

-- =============================================
-- GENERATE ORDER NUMBER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orders;
  
  NEW.order_number := 'ORD-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION public.generate_order_number();
