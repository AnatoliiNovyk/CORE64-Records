import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

const MAX_NAME = 100
const MAX_EMAIL = 254
const MAX_SUBJECT = 200
const MAX_MESSAGE = 5000
const RATE_LIMIT_WINDOW_MINUTES = 5
const RATE_LIMIT_MAX_REQUESTS = 3
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return "unknown"
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { name, email, subject, message, recaptcha_token } = body as {
      name?: string
      email?: string
      subject?: string
      message?: string
      recaptcha_token?: string
    }

    // --- Field validation ---
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return json({ error: "Missing required fields" }, 400)
    }
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return json({ error: "Missing required fields" }, 400)
    }
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return json({ error: "Missing required fields" }, 400)
    }
    if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
      return json({ error: "Field too long" }, 400)
    }
    if (subject && (typeof subject !== "string" || subject.length > MAX_SUBJECT)) {
      return json({ error: "Field too long" }, 400)
    }

    // --- Supabase admin client (service role bypasses RLS) ---
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // --- Rate limiting (per IP, using the database as durable store) ---
    const clientIp = getClientIp(req)
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString()

    const { count: recentCount, error: countError } = await supabaseAdmin
      .from("contact_rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip", clientIp)
      .gte("created_at", windowStart)

    if (countError) {
      console.error("Rate limit check failed:", countError.message)
      return json({ error: "internal_error" }, 500)
    }

    if ((recentCount ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      return json({ error: "rate_limited" }, 429)
    }

    // Record this request for rate limiting
    const { error: rateLogError } = await supabaseAdmin
      .from("contact_rate_limits")
      .insert({ ip: clientIp })

    if (rateLogError) {
      console.error("Rate limit log failed:", rateLogError.message)
    }

    // Clean up entries older than the window (best-effort, non-blocking)
    supabaseAdmin
      .from("contact_rate_limits")
      .delete()
      .lt("created_at", windowStart)
      .then(({ error }) => {
        if (error) console.error("Rate limit cleanup failed:", error.message)
      })

    // --- reCAPTCHA verification ---
    const { data: secretSetting } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "recaptcha_secret_key")
      .maybeSingle()

    const secretKey = secretSetting?.value ?? ""

    if (secretKey && recaptcha_token) {
      const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(recaptcha_token)}`,
      })
      const verifyData = await verifyRes.json()

      if (!verifyData.success || (verifyData.score !== undefined && verifyData.score < 0.5)) {
        return json({ error: "recaptcha_failed" }, 400)
      }
    } else if (secretKey && !recaptcha_token) {
      return json({ error: "recaptcha_missing" }, 400)
    }

    // --- Insert the contact message ---
    const { error: insertError } = await supabaseAdmin
      .from("contact_messages")
      .insert({
        name: name.trim(),
        email: email.trim(),
        subject: subject?.trim() || null,
        message: message.trim(),
      })

    if (insertError) {
      console.error("Contact insert failed:", insertError.message)
      return json({ error: "internal_error" }, 500)
    }

    return json({ success: true }, 200)
  } catch (err) {
    console.error("submit-contact unexpected error:", String(err))
    return json({ error: "internal_error" }, 500)
  }
})
