import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BackupCodesNotificationRequest {
  email: string;
  userName?: string;
  action: 'regenerated' | 'enabled' | 'disabled';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userName, action }: BackupCodesNotificationRequest = await req.json();

    // Validate required fields
    if (!email || !action) {
      throw new Error("Missing required fields: email and action are required");
    }

    const displayName = userName || email;
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    let subject = '';
    let content = '';

    switch (action) {
      case 'regenerated':
        subject = '🔐 Your 2FA Backup Codes Were Regenerated';
        content = `
          <h1 style="color: #000; font-family: sans-serif;">Security Alert</h1>
          <p style="font-family: sans-serif; color: #333;">Hello ${displayName},</p>
          <p style="font-family: sans-serif; color: #333;">Your two-factor authentication (2FA) backup codes were regenerated on <strong>${timestamp}</strong>.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-family: sans-serif; color: #991b1b; margin: 0;"><strong>⚠️ Important:</strong> All previous backup codes have been invalidated and can no longer be used.</p>
          </div>
          <p style="font-family: sans-serif; color: #333;">If you did not perform this action, please:</p>
          <ol style="font-family: sans-serif; color: #333;">
            <li>Change your password immediately</li>
            <li>Review your recent account activity</li>
            <li>Contact support if you notice any suspicious activity</li>
          </ol>
          <p style="font-family: sans-serif; color: #666; font-size: 14px; margin-top: 30px;">This is an automated security notification. Please do not reply to this email.</p>
        `;
        break;
      
      case 'enabled':
        subject = '✅ Two-Factor Authentication Enabled';
        content = `
          <h1 style="color: #000; font-family: sans-serif;">2FA Enabled Successfully</h1>
          <p style="font-family: sans-serif; color: #333;">Hello ${displayName},</p>
          <p style="font-family: sans-serif; color: #333;">Two-factor authentication was enabled on your account on <strong>${timestamp}</strong>.</p>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-family: sans-serif; color: #166534; margin: 0;"><strong>✓ Your account is now more secure.</strong> A verification code will be required in addition to your password when signing in.</p>
          </div>
          <p style="font-family: sans-serif; color: #333;"><strong>Important:</strong> Make sure you've saved your backup codes in a safe place. You'll need them if you lose access to your authenticator app.</p>
          <p style="font-family: sans-serif; color: #333;">If you did not enable 2FA, please contact support immediately.</p>
          <p style="font-family: sans-serif; color: #666; font-size: 14px; margin-top: 30px;">This is an automated security notification. Please do not reply to this email.</p>
        `;
        break;
      
      case 'disabled':
        subject = '⚠️ Two-Factor Authentication Disabled';
        content = `
          <h1 style="color: #000; font-family: sans-serif;">Security Alert</h1>
          <p style="font-family: sans-serif; color: #333;">Hello ${displayName},</p>
          <p style="font-family: sans-serif; color: #333;">Two-factor authentication was disabled on your account on <strong>${timestamp}</strong>.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="font-family: sans-serif; color: #991b1b; margin: 0;"><strong>⚠️ Your account is now less secure.</strong> Only your password is required to sign in.</p>
          </div>
          <p style="font-family: sans-serif; color: #333;">If you did not disable 2FA:</p>
          <ol style="font-family: sans-serif; color: #333;">
            <li>Change your password immediately</li>
            <li>Re-enable two-factor authentication</li>
            <li>Contact support if you notice any suspicious activity</li>
          </ol>
          <p style="font-family: sans-serif; color: #666; font-size: 14px; margin-top: 30px;">This is an automated security notification. Please do not reply to this email.</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Security <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: content,
    });

    console.log("Security notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, ...emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in backup-codes-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
