// Envío de WhatsApp saliente por Evolution API (misma instancia que la bandeja
// de leads). Solo texto; no bloquea nunca la operación que lo invoca.

function normalizeColombianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  if (digits.length === 12 && digits.startsWith('57')) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function isWhatsappConfigured(): boolean {
  return Boolean(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY);
}

/**
 * Envía un texto por WhatsApp al número dado. Devuelve true si Evolution
 * aceptó el mensaje; false si no hay configuración, el número no es válido o
 * la API falló (el error queda en el log).
 */
export async function sendWhatsappText(rawPhone: string | null | undefined, text: string): Promise<boolean> {
  if (!rawPhone || !isWhatsappConfigured()) return false;
  const number = normalizeColombianPhone(rawPhone);
  if (!number) return false;
  const url = process.env.EVOLUTION_API_URL!.replace(/\/$/, '');
  const instance = process.env.EVOLUTION_INSTANCE || 'Peritus';
  try {
    const response = await fetch(`${url}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: process.env.EVOLUTION_API_KEY! },
      body: JSON.stringify({ number, text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      console.error('[whatsapp] Evolution API error:', response.status, await response.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[whatsapp] Error enviando WhatsApp:', err);
    return false;
  }
}
