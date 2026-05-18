import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { tipo, destinatarios, asunto, contenido } = await req.json()

  const emails = destinatarios.map((email: string) => ({
    from: "Conecta Barrio <onboarding@resend.dev>",
    to: email,
    subject: asunto,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px">
        <h2 style="color:#2E7D32">🏘️ Conecta Barrio - Barrio Las Heras</h2>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin-top:16px">
          ${contenido}
        </div>
        <p style="color:#9E9E9E;font-size:12px;margin-top:16px">
          Este mensaje fue enviado desde la plataforma Conecta Barrio.
        </p>
      </div>
    `
  }))

  for (const email of emails) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`
      },
      body: JSON.stringify(email)
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  })
})