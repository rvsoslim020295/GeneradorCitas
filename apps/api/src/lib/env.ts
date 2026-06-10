// Carga y valida secretos críticos al arrancar.
// En producción, un secreto ausente o débil ABORTA el proceso en lugar de
// degradar en silencio a un valor por defecto conocido (auditoría 1.1).

const isProduction = process.env.NODE_ENV === "production";

function requireSecret(name: string, devFallback: string): string {
  const value = process.env[name];

  if (!value) {
    if (isProduction) {
      throw new Error(`[FATAL] ${name} no está definido. Abortando arranque en producción.`);
    }
    console.warn(`[env] ${name} no definido — usando fallback de desarrollo. NO usar en producción.`);
    return devFallback;
  }

  if (isProduction && value.length < 32) {
    throw new Error(`[FATAL] ${name} es demasiado corto (<32 caracteres). Usa un secreto robusto.`);
  }

  return value;
}

export const JWT_SECRET = requireSecret("JWT_SECRET", "dev_secret_change_in_production");
export const ADMIN_JWT_SECRET = requireSecret("ADMIN_JWT_SECRET", "admin_secret_change_in_production");
