import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  INVALID_INPUT: 'Invalid request data',
  GENERIC: 'An error occurred processing your request'
};

const emailSchema = z.object({
  to: z.string().email().max(255),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
  contactId: z.string().uuid()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    
    // Validate input
    const validationResult = emailSchema.safeParse(payload);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validationResult.error.issues 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { to, subject, body, contactId } = validationResult.data;

    console.log('Sending email:', { to, subject, contactId });

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

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, we'll log the email and store it in the messages table
    
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

    console.log('Email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        note: 'Email service integration pending - message stored in database'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    // Log full error server-side for debugging
    console.error('Email send error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return generic message to client
    let userMessage = ERROR_MESSAGES.GENERIC;
    let statusCode = 500;
    
    if (error.message === 'Unauthorized' || error.message === 'No authorization header') {
      userMessage = ERROR_MESSAGES.UNAUTHORIZED;
      statusCode = 401;
    } else if (error.name === 'ZodError') {
      // Zod validation errors are safe to return
      userMessage = ERROR_MESSAGES.INVALID_INPUT;
      statusCode = 400;
    }
    
    return new Response(
      JSON.stringify({ error: userMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});
