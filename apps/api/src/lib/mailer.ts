const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendBrevoEmail(payload: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY no configurado");

  const senderName = process.env.BREVO_SENDER_NAME ?? "GlowManager";
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@glowmanager.app";

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      ...payload,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error ${res.status}: ${err}`);
  }
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${APP_URL}/verificar-email?token=${token}`;

  if (!process.env.BREVO_API_KEY) {
    console.log("\n[DEV] Email de verificación:");
    console.log(`   Para: ${email}`);
    console.log(`   Link: ${verifyUrl}\n`);
    return;
  }

  await sendBrevoEmail({
    to: [{ email, name }],
    subject: "Verifica tu cuenta en GlowManager",
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #4441C4;">¡Bienvenido a GlowManager, ${name}!</h2>
        <p>Haz clic en el botón para verificar tu correo y activar tu cuenta:</p>
        <a href="${verifyUrl}"
           style="display:inline-block; background:#4441C4; color:#fff; padding:12px 24px;
                  border-radius:8px; text-decoration:none; font-weight:600; margin:16px 0;">
          Verificar mi cuenta
        </a>
        <p style="color:#888; font-size:13px;">
          Si no creaste una cuenta en GlowManager, ignora este correo.<br>
          El enlace expira en 24 horas.
        </p>
        <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
        <p style="color:#aaa; font-size:12px;">GlowManager · Panel de gestión para negocios de belleza</p>
      </div>
    `,
  });
}
