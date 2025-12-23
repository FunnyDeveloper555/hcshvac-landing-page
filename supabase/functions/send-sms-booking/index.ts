import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSMSRequest {
  invitationId: string;
  phoneNumber: string;
  companyName: string;
  bookingUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      return new Response(
        JSON.stringify({ error: "Supabase credentials not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { invitationId, phoneNumber, companyName, bookingUrl }: SendSMSRequest = await req.json();

    console.log(`Sending SMS to ${phoneNumber} for invitation ${invitationId}`);
    console.log(`Booking URL: ${bookingUrl}`);

    // Format phone number (ensure it has country code)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone;
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Create SMS message
    const messageBody = `${companyName} has sent you a booking link. Click here to complete your profile and schedule an appointment: ${bookingUrl}`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", formattedPhone);
    formData.append("From", TWILIO_PHONE_NUMBER);
    formData.append("Body", messageBody);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      return new Response(
        JSON.stringify({ error: twilioResult.message || "Failed to send SMS" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("SMS sent successfully:", twilioResult.sid);

    // Update invitation status in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { error: updateError } = await supabase
      .from("booking_invitations")
      .update({ 
        status: "sent", 
        sent_at: new Date().toISOString() 
      })
      .eq("id", invitationId);

    if (updateError) {
      console.error("Failed to update invitation status:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: twilioResult.sid,
        status: twilioResult.status
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-sms-booking function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
