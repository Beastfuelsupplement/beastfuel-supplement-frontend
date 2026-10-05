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

  if (data.storeName && (typeof data.storeName !== 'string' || data.storeName.length > 100)) {
    return { valid: false, error: 'Invalid storeName' };
  }

  return { valid: true };
};

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: string;
  storeName?: string;
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

    // Parse request body early to validate email match
    const rawData = await req.json();
    const validation = validateOrderInput(rawData);
    if (!validation.valid) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user can only send confirmation to their own email address
    // This prevents users from sending emails impersonating the store
    if (user.email?.toLowerCase() !== rawData.customerEmail.toLowerCase()) {
      console.error(`Email mismatch: user email ${user.email} vs customer email ${rawData.customerEmail}`);
      return new Response(
        JSON.stringify({ error: 'You can only send order confirmations to your own email address' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Email verified for user: ${user.id}`);

    const { 
      orderId, 
      customerName, 
      customerEmail, 
      items, 
      total, 
      shippingAddress,
      storeName = "BEASTFUEL Supplements"
    }: OrderConfirmationRequest = rawData;

    console.log(`Sending order confirmation to customer: ${customerEmail}`);
    console.log(`Order ID: ${orderId}`);

    // Build items table with escaped HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${escapeHtml(item.productName)}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #22c55e; text-align: center; margin-bottom: 10px;">
              ✓ Order Confirmed!
            </h1>
            <p style="text-align: center; color: #666; margin-bottom: 30px;">
              Thank you for your order, ${escapeHtml(customerName)}!
            </p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">Order Number</p>
              <h2 style="margin: 5px 0 0 0; color: #333; font-size: 24px;">#${escapeHtml(orderId)}</h2>
            </div>

            <h3 style="color: #333; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; font-size: 14px; color: #666;">Product</th>
                  <th style="padding: 12px; text-align: center; font-size: 14px; color: #666;">Qty</th>
                  <th style="padding: 12px; text-align: right; font-size: 14px; color: #666;">Price</th>
                  <th style="padding: 12px; text-align: right; font-size: 14px; color: #666;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div style="background-color: #333; color: white; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; margin-bottom: 25px;">
              <span style="font-size: 18px;">Total</span>
              <span style="font-size: 22px; font-weight: bold;">$${total.toFixed(2)}</span>
            </div>

            ${shippingAddress ? `
              <div style="margin-bottom: 25px;">
                <h3 style="color: #333; margin-bottom: 10px;">Shipping Address</h3>
                <p style="color: #666; margin: 0; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
                  ${escapeHtml(shippingAddress)}
                </p>
              </div>
            ` : ''}

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>What's next?</strong><br>
                We're preparing your order and will notify you once it ships. You can track your order status in your account.
              </p>
            </div>

            <p style="color: #666; text-align: center; font-size: 14px;">
              Questions about your order?<br>
              Reply to this email and we'll be happy to help!
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              Thank you for shopping with ${escapeHtml(storeName)}!<br>
              This is an automated confirmation email.
            </p>
          </div>
        </body>
      </html>
    `;

    console.log("Sending order confirmation email...");

    const emailResponse = await resend.emails.send({
      from: `${escapeHtml(storeName)} <onboarding@resend.dev>`,
      to: [customerEmail],
      subject: `Order Confirmed! #${escapeHtml(orderId)} - Thank you for your purchase`,
      html: emailHtml,
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        orderId,
        customerEmail
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in customer-order-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
