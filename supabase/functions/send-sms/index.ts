import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, body, contactId } = await req.json();

    console.log('Sending SMS:', { to, contactId });

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // TODO: Integrate with SMS service (Twilio, MessageBird, etc.)
    // For now, we'll log the SMS and store it in the messages table
    
    // Store the message in the database
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        contact_id: contactId,
        sender_id: user.id,
        sender_type: 'admin',
        content: body,
      });

    if (messageError) throw messageError;

    console.log('SMS sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        note: 'SMS service integration pending - message stored in database'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Failed to send SMS'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
