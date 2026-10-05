import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in emails
const escapeHtml = (unsafe: string): string => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Validate email format
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 254;
};

// Validate low stock input
const validateLowStockInput = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  if (!isValidEmail(data.adminEmail)) {
    return { valid: false, error: 'Invalid adminEmail' };
  }

  if (!Array.isArray(data.products) || data.products.length > 1000) {
    return { valid: false, error: 'Invalid products array' };
  }

  for (const product of data.products) {
    if (!product.id || typeof product.id !== 'string' || product.id.length > 50) {
      return { valid: false, error: 'Invalid product id' };
    }
    if (!product.name || typeof product.name !== 'string' || product.name.length > 200) {
      return { valid: false, error: 'Invalid product name' };
    }
    if (typeof product.stock !== 'number' || product.stock < 0 || product.stock > 100000) {
      return { valid: false, error: 'Invalid product stock' };
    }
  }

  if (data.threshold !== undefined && (typeof data.threshold !== 'number' || data.threshold < 0 || data.threshold > 1000)) {
    return { valid: false, error: 'Invalid threshold' };
  }

  return { valid: true };
};

interface LowStockProduct {
  name: string;
  stock: number;
  id: string;
}

interface LowStockRequest {
  products: LowStockProduct[];
  adminEmail: string;
  threshold?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Invalid token:", authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Verify admin role - only admins can send low stock notifications
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || roleData?.role !== 'admin') {
      console.error("Admin access required:", roleError || 'User is not admin');
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Admin role verified for user: ${user.id}`);

    // Parse and validate input
    const rawData = await req.json();
    const validation = validateLowStockInput(rawData);
    if (!validation.valid) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { products, adminEmail, threshold = 10 }: LowStockRequest = rawData;

    console.log(`Checking low stock notification for ${products.length} products`);
    console.log(`Admin email: ${adminEmail}, Threshold: ${threshold}`);

    // Filter products that are below threshold
    const lowStockProducts = products.filter(p => p.stock <= threshold && p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock === 0);

    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
      console.log("No low stock products to notify about");
      return new Response(
        JSON.stringify({ message: "No low stock products" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build email content with escaped HTML
    const lowStockHtml = lowStockProducts.length > 0 
      ? `
        <h2 style="color: #f59e0b;">⚠️ Low Stock Products (${lowStockProducts.length})</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #fef3c7;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Current Stock</th>
            </tr>
          </thead>
          <tbody>
            ${lowStockProducts.map(p => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(p.name)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #f59e0b; font-weight: bold;">${p.stock}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` 
      : '';

    const outOfStockHtml = outOfStockProducts.length > 0 
      ? `
        <h2 style="color: #ef4444;">🚨 Out of Stock Products (${outOfStockProducts.length})</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #fee2e2;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${outOfStockProducts.map(p => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(p.name)}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; color: #ef4444; font-weight: bold;">OUT OF STOCK</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` 
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">
            📦 Stock Alert - Action Required
          </h1>
          <p style="color: #666;">
            The following products need your attention. Please restock as soon as possible.
          </p>
          ${outOfStockHtml}
          ${lowStockHtml}
          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
            This is an automated notification from your BEASTFUEL Supplements store.
          </p>
        </body>
      </html>
    `;

    console.log("Sending low stock notification email...");

    const emailResponse = await resend.emails.send({
      from: "BEASTFUEL Store <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🚨 Stock Alert: ${outOfStockProducts.length} out of stock, ${lowStockProducts.length} low stock`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in low-stock-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
