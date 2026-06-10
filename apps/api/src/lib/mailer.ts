import nodemailer from "nodemailer";
import { lookup } from "dns/promises";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function createTransporter() {
  const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT ?? 465);

  // Forzar resolución IPv4 — Railway resuelve a IPv6 por defecto y lo bloquea
  let host = smtpHost;
  try {
    const { address } = await lookup(smtpHost, { family: 4 });
    host = address;
    console.log(`[mailer] SMTP resuelto a IPv4: ${host}`);
  } catch (e) {
    console.warn("[mailer] No se pudo resolver IPv4, usando hostname:", smtpHost);
  }

  return nodemailer.createTransport({
    host,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  } as any);
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verifyUrl = `${APP_URL}/verificar-email?token=${token}`;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("\n[DEV] Email de verificación:");
    console.log(`   Para: ${email}`);
    console.log(`   Link: ${verifyUrl}\n`);
    return;
  }

  const transporter = await createTransporter();
  await transporter.sendMail({
    from: `"GlowManager" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verifica tu cuenta en GlowManager",
    html: `
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
