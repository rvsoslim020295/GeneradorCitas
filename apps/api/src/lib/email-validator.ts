import { resolve } from "dns/promises";
import { readFileSync } from "fs";
import { createRequire } from "module";

// Carga defensiva: si el paquete falta o el JSON está corrupto, no tumbamos el
// arranque — degradamos a lista vacía (auditoría 12.4).
let disposableDomains: string[] = [];
try {
  const _require = createRequire(import.meta.url);
  const _pkgPath: string = _require.resolve("disposable-email-domains");
  disposableDomains = JSON.parse(readFileSync(_pkgPath, "utf-8"));
} catch (err) {
  console.error("[email-validator] No se pudo cargar disposable-email-domains:", err);
}
const disposableSet = new Set(disposableDomains);

/** Verifica que el dominio tenga servidores MX activos */
async function hasMxRecords(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  try {
    const records = await resolve(domain, "MX");
    return records.length > 0;
  } catch {
    return false;
  }
}

/** Bloquea dominios desechables (mailinator, temp-mail, guerrillamail, etc.) */
function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  // Match exacto o por dominio raíz: bloquea también subdominios como
  // x.mailinator.com que antes evadían el filtro (auditoría 12.4).
  const parts = domain.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (disposableSet.has(parts.slice(i).join("."))) return true;
  }
  return false;
}

/** Verificación profunda con UserCheck (1000/mes gratis, sin tarjeta) */
async function verifyWithUserCheck(email: string): Promise<{ valid: boolean; reason?: string }> {
  const apiKey = process.env.USERCHECK_API_KEY;
  if (!apiKey) return { valid: true }; // Sin key, dejamos pasar

  try {
    const res = await fetch(
      `https://api.usercheck.com/email/${encodeURIComponent(email)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(5000), // timeout 5s
      }
    );

    if (!res.ok) return { valid: true }; // Si la API falla, no bloqueamos

    const data = await res.json() as {
      disposable: boolean;
      mx: boolean;
      status: string; // "valid" | "invalid" | "unknown"
    };

    if (data.disposable) {
      return { valid: false, reason: "No se permiten correos temporales o desechables." };
    }
    if (data.mx === false) {
      return { valid: false, reason: "El dominio del correo no puede recibir emails." };
    }
    if (data.status === "invalid") {
      return { valid: false, reason: "El correo electrónico no es válido." };
    }

    return { valid: true };
  } catch {
    return { valid: true }; // Timeout u otro error — no bloqueamos
  }
}

/** Validación completa: formato → desechable → MX → AbstractAPI */
export async function validateEmailDeep(email: string): Promise<{ valid: boolean; error?: string }> {
  // 1. Formato básico
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, error: "Formato de correo electrónico inválido." };
  }

  // 2. Dominio desechable
  if (isDisposableEmail(email)) {
    return { valid: false, error: "No se permiten correos temporales o desechables." };
  }

  // 3. Registros MX — el dominio existe y puede recibir emails
  const hasMx = await hasMxRecords(email);
  if (!hasMx) {
    return { valid: false, error: "El dominio del correo no existe o no puede recibir emails." };
  }

  // 4. Verificación profunda con UserCheck (si está configurada)
  const deepCheck = await verifyWithUserCheck(email);
  if (!deepCheck.valid) {
    return { valid: false, error: deepCheck.reason };
  }

  return { valid: true };
}
