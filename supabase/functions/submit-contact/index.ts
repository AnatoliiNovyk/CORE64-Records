import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { name, email, subject, message, recaptcha_token } = await req.json()

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Use service role to bypass RLS when reading the secret key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Fetch the reCAPTCHA secret key from settings
    const { data: secretSetting } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "recaptcha_secret_key")
      .maybeSingle()

    const secretKey = secretSetting?.value ?? ""

    // Only verify if a secret key is configured AND a token was provided
    if (secretKey && recaptcha_token) {
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(recaptcha_token)}`,
      })
      const verifyData = await verifyRes.json()

      if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
        return new Response(
          JSON.stringify({ error: "recaptcha_failed", score: verifyData.score ?? 0 }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    } else if (secretKey && !recaptcha_token) {
      // Secret is configured but no token — reject
      return new Response(
        JSON.stringify({ error: "recaptcha_missing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Insert the contact message
    const { error: insertError } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        name,
        email,
        subject: subject || null,
        message,
      })

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "db_error", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "internal_error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
