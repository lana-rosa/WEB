// Da de baja los recordatorios de carrito abandonado. La página https://lanarosacrochet.com/baja-recordatorios.html llama aquí y muestra el mensaje.
import { createClient } from "jsr:@supabase/supabase-js@2";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  let t = new URL(req.url).searchParams.get("t") || "";
  if (!t && req.method === "POST") { try { t = String((await req.json()).t || ""); } catch { /* sin cuerpo */ } }
  if (!UUID.test(t)) return json({ ok: false, error: "Enlace no válido" }, 400);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  await sb.rpc("baja_carrito_abandonado", { p_token: t });
  return json({ ok: true });
});
