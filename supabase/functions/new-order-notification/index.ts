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

// Validate order input
const validateOrderInput = (data: any): { valid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  if (!data.orderId || typeof data.orderId !== 'string' || data.orderId.length > 50) {
    return { valid: false, error: 'Invalid orderId' };
  }

  if (!data.customerName || typeof data.customerName !== 'string' || data.customerName.length > 100) {
    return { valid: false, error: 'Invalid customerName' };
  }

  if (!isValidEmail(data.customerEmail)) {
    return { valid: false, error: 'Invalid customerEmail' };
  }

  if (!isValidEmail(data.adminEmail)) {
    return { valid: false, error: 'Invalid adminEmail' };
  }

  if (!Array.isArray(data.items) || data.items.length === 0 || data.items.length > 100) {
    return { valid: false, error: 'Invalid items array' };
  }

  for (const item of data.items) {
    if (!item.productName || typeof item.productName !== 'string' || item.productName.length > 200) {
      return { valid: false, error: 'Invalid item productName' };
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || item.quantity > 1000) {
      return { valid: false, error: 'Invalid item quantity' };
    }
    if (typeof item.price !== 'number' || item.price < 0 || item.price > 100000) {
      return { valid: false, error: 'Invalid item price' };
    }
  }

  if (typeof data.total !== 'number' || data.total < 0 || data.total > 1000000) {
    return { valid: false, error: 'Invalid total' };
  }

  if (data.shippingAddress && (typeof data.shippingAddress !== 'string' || data.shippingAddress.length > 500)) {
    return { valid: false, error: 'Invalid shippingAddress' };
  }

  return { valid: true };
};

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface NewOrderRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: string;
  adminEmail: string;
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

    // Verify admin role - only admins can send new order notifications
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
    const validation = validateOrderInput(rawData);
    if (!validation.valid) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { orderId, customerName, customerEmail, items, total, shippingAddress, adminEmail }: NewOrderRequest = rawData;

    console.log(`Sending new order notification for order ${orderId}`);
    console.log(`Admin email: ${adminEmail}`);

    // Build items table with escaped HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${escapeHtml(item.productName)}</td>
        <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">
            🎉 New Order Received!
          </h1>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 10px 0; color: #333;">Order #${escapeHtml(orderId)}</h2>
            <p style="margin: 0; color: #666;">
              <strong>Customer:</strong> ${escapeHtml(customerName)} (${escapeHtml(customerEmail)})
            </p>
            ${shippingAddress ? `<p style="margin: 5px 0 0 0; color: #666;"><strong>Shipping:</strong> ${escapeHtml(shippingAddress)}</p>` : ''}
          </div>

          <h3 style="color: #333;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Product</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Price</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #22c55e; color: white;">
                <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Total:</td>
                <td style="padding: 12px; text-align: right; font-weight: bold; border: 1px solid #ddd;">$${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <p style="color: #666;">
            Please process this order as soon as possible.
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
            This is an automated notification from your BEASTFUEL Supplements store.
          </p>
        </body>
      </html>
    `;

    console.log("Sending new order notification email...");

    const emailResponse = await resend.emails.send({
      from: "BEASTFUEL Store <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🎉 New Order #${escapeHtml(orderId)} - $${total.toFixed(2)} from ${escapeHtml(customerName)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        orderId
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in new-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
