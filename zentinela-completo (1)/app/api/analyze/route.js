// app/api/analyze/route.js
// Endpoint serverless (corre en Vercel). Siempre responde con el motor de
// patrones. Si existe ANTHROPIC_API_KEY en las variables de entorno, añade
// una explicación semántica de la IA encima. Nunca guarda el mensaje.

import { analizarMensaje } from "../../../lib/analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let texto = "";
  try {
    const body = await req.json();
    texto = (body?.mensaje || "").toString().slice(0, 4000);
  } catch (_) {
    return Response.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const base = analizarMensaje(texto);
  if (!base.ok) {
    return Response.json(base, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(base);
  }

  // Refuerzo con IA: pedimos a Claude un análisis en JSON y lo combinamos.
  try {
    const prompt = `Eres Zentinela IA, un analizador de estafas por WhatsApp para usuarios de Latinoamérica.
Analiza el siguiente mensaje y responde SOLO con un objeto JSON válido, sin texto extra ni backticks, con esta forma:
{"riesgo":"ALTO|MEDIO|BAJO","es_estafa":true|false,"explicacion":"1-2 frases claras en español","consejo":"1 frase accionable"}

Considera suplantación de bancos peruanos (BCP, Yape, Interbank, BBVA, Scotiabank), SUNAT, premios falsos, urgencia, pedidos de clave/código/tarjeta y links no oficiales.

Mensaje:
"""${texto}"""`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) return Response.json(base);

    const data = await r.json();
    const raw = (data?.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const ia = JSON.parse(raw);

    // Combinamos: nos quedamos con el riesgo más alto entre patrones e IA.
    const orden = { BAJO: 0, MEDIO: 1, ALTO: 2 };
    const riesgoIA = (ia.riesgo || "").toUpperCase();
    const riesgoFinal =
      orden[riesgoIA] > orden[base.riesgo] ? riesgoIA : base.riesgo;

    return Response.json({
      ...base,
      motor: "patrones+ia",
      riesgo: riesgoFinal,
      esEstafa: riesgoFinal !== "BAJO",
      explicacionIA: ia.explicacion || null,
      consejo: ia.consejo || base.consejo,
    });
  } catch (_) {
    // Si la IA falla por lo que sea, el motor de patrones ya respondió bien.
    return Response.json(base);
  }
}
