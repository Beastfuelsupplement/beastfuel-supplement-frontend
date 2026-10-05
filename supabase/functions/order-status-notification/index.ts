import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

// Validate order status input
const validateOrderStatusInput = (data: any): { valid: boolean; error?: string } => {
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

  if (!data.newStatus || typeof data.newStatus !== 'string' || data.newStatus.length > 50) {
    return { valid: false, error: 'Invalid newStatus' };
  }

  if (!data.previousStatus || typeof data.previousStatus !== 'string' || data.previousStatus.length > 50) {
    return { valid: false, error: 'Invalid previousStatus' };
  }

  if (!data.storeName || typeof data.storeName !== 'string' || data.storeName.length > 100) {
    return { valid: false, error: 'Invalid storeName' };
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

interface OrderStatusRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  newStatus: string;
  previousStatus: string;
  items: Array<{ productName: string; quantity: number; price: number }>;
  total: number;
  shippingAddress?: string;
  storeName: string;
}

const getStatusMessage = (status: string): { subject: string; heading: string; message: string; icon: string } => {
  switch (status.toLowerCase()) {
    case 'processing':
      return {
        subject: 'Your order is being processed',
        heading: 'Order Being Processed! 📦',
        message: 'Great news! We\'ve started processing your order. Our team is carefully preparing your items for shipment.',
        icon: '📦'
      };
    case 'shipped':
      return {
        subject: 'Your order has been shipped',
        heading: 'Your Order is On Its Way! 🚚',
        message: 'Exciting news! Your order has been shipped and is on its way to you. You can expect delivery soon.',
        icon: '🚚'
      };
    case 'completed':
    case 'delivered':
      return {
        subject: 'Your order has been delivered',
        heading: 'Order Delivered! ✅',
        message: 'Your order has been successfully delivered. We hope you love your purchase! Thank you for shopping with us.',
        icon: '✅'
      };
    case 'cancelled':
      return {
        subject: 'Your order has been cancelled',
        heading: 'Order Cancelled ❌',
        message: 'Your order has been cancelled. If you have any questions about this cancellation, please don\'t hesitate to contact us.',
        icon: '❌'
      };
    default:
      return {
        subject: 'Order status update',
        heading: 'Order Status Updated',
        message: `Your order status has been updated to: ${escapeHtml(status)}`,
        icon: '📋'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Order status notification function called");
  
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

    // Verify admin role - only admins can send order status notifications
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
    const validation = validateOrderStatusInput(rawData);
    if (!validation.valid) {
      console.error("Validation error:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      orderId,
      customerName,
      customerEmail,
      newStatus,
      previousStatus,
      items,
      total,
      shippingAddress,
      storeName,
    }: OrderStatusRequest = rawData;

    console.log(`Processing status update for order ${orderId}: ${previousStatus} -> ${newStatus}`);

    const statusInfo = getStatusMessage(newStatus);

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #333;">${escapeHtml(item.productName)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #00ff88; font-size: 32px; margin: 0; letter-spacing: 2px;">${escapeHtml(storeName)}</h1>
          </div>
          
          <!-- Status Icon -->
          <div style="text-align: center; margin-bottom: 30px;">
            <span style="font-size: 64px;">${statusInfo.icon}</span>
          </div>
          
          <!-- Main Content -->
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 40px; border: 1px solid #333;">
            <h2 style="color: #ffffff; font-size: 28px; margin: 0 0 20px 0; text-align: center;">${statusInfo.heading}</h2>
            
            <p style="color: #888; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
              Hi ${escapeHtml(customerName)},<br><br>
              ${statusInfo.message}
            </p>
            
            <!-- Order Details -->
            <div style="background: #111; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #00ff88; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Details</h3>
              <p style="color: #fff; margin: 0 0 8px 0;">
                <strong>Order ID:</strong> ${escapeHtml(orderId)}
              </p>
              <p style="color: #fff; margin: 0 0 8px 0;">
                <strong>Previous Status:</strong> <span style="color: #888;">${escapeHtml(previousStatus)}</span>
              </p>
              <p style="color: #fff; margin: 0;">
                <strong>New Status:</strong> <span style="color: #00ff88;">${escapeHtml(newStatus)}</span>
              </p>
            </div>
            
            <!-- Order Items -->
            <div style="background: #111; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #00ff88; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; color: #fff;">
                <thead>
                  <tr style="border-bottom: 2px solid #333;">
                    <th style="padding: 12px; text-align: left; color: #888;">Item</th>
                    <th style="padding: 12px; text-align: center; color: #888;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #888;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: bold; color: #fff;">Total:</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: bold; color: #00ff88; font-size: 20px;">$${total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            ${shippingAddress ? `
            <!-- Shipping Address -->
            <div style="background: #111; border-radius: 12px; padding: 24px;">
              <h3 style="color: #00ff88; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h3>
              <p style="color: #fff; margin: 0; line-height: 1.6;">${escapeHtml(shippingAddress)}</p>
            </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px;">
            <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">
              Questions? Contact us at support@${escapeHtml(storeName).toLowerCase().replace(/\s+/g, '')}.com
            </p>
            <p style="color: #444; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} ${escapeHtml(storeName)}. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: `${escapeHtml(storeName)} <onboarding@resend.dev>`,
      to: [customerEmail],
      subject: `${statusInfo.subject} - Order #${escapeHtml(orderId)}`,
      html: emailHtml,
    });

    console.log("Order status email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in order-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
