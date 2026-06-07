/**
 * Script para crear el super administrador de GlowManager.
 * Uso: npx tsx src/scripts/create-super-admin.ts
 *
 * Configura las variables SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD y SUPER_ADMIN_NAME
 * en el .env antes de ejecutar.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";

  if (!email || !password) {
    console.error("❌  Define SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD en el .env");
    process.exit(1);
  }

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  Ya existe un super admin con el email ${email}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const superAdmin = await prisma.superAdmin.create({
    data: { email, password: hashed, name },
  });

  console.log(`✅  Super admin creado: ${superAdmin.name} <${superAdmin.email}>`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
