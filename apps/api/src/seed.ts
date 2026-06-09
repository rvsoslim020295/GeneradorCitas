import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Creando datos de prueba...");

  // Limpiamos en orden por las relaciones de FK
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.collaborator.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  const business = await prisma.business.create({
    data: { name: "Studio Elegance", type: "salon" },
  });

  const hashedPassword = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      name: "Ana M.",
      email: "ana@glowmanager.com",
      password: hashedPassword,
      role: "OWNER",
      businessId: business.id,
    },
  });

  // Clientes del directorio
  await prisma.client.createMany({
    data: [
      {
        name: "Valeria Morales",
        phone: "+52 55 1234 5678",
        totalVisits: 24,
        totalSpent: 12450,
        businessId: business.id,
      },
      {
        name: "Carlos Gómez",
        phone: "+52 55 9876 5432",
        totalVisits: 8,
        totalSpent: 3200,
        businessId: business.id,
      },
      {
        name: "Ana Sofía Ruiz",
        phone: "+52 81 2345 6789",
        totalVisits: 45,
        totalSpent: 28900,
        businessId: business.id,
      },
      {
        name: "Luis Ramírez",
        phone: "+52 33 4567 8901",
        totalVisits: 2,
        totalSpent: 850,
        businessId: business.id,
      },
    ],
  });

  // Colaboradores del equipo
  await prisma.collaborator.createMany({
    data: [
      {
        name: "Elena Rodriguez",
        role: "Senior Stylist",
        specialties: ["Corte Mujer", "Balayage", "Coloración"],
        isActive: true,
        businessId: business.id,
      },
      {
        name: "Carlos Mendoza",
        role: "Master Barber",
        specialties: ["Corte Hombre", "Barba", "Tratamiento"],
        isActive: true,
        businessId: business.id,
      },
      {
        name: "Sofia Laurent",
        role: "Colorista",
        specialties: ["Tintes", "Mechas"],
        isActive: false,
        businessId: business.id,
      },
    ],
  });

  // Catálogo de servicios
  await prisma.service.createMany({
    data: [
      {
        name: "Corte Clásico",
        description: "Corte tradicional con tijera o máquina, incluye lavado y peinado básico.",
        category: "Peluquería",
        durationMin: 45,
        price: 25,
        businessId: business.id,
      },
      {
        name: "Corte Fade",
        description: "Degradado perfecto con navaja o máquina al ras, terminaciones precisas.",
        category: "Peluquería",
        durationMin: 60,
        price: 30,
        businessId: business.id,
      },
      {
        name: "Tinte Completo",
        description: "Coloración en todo el cabello utilizando productos de alta calidad.",
        category: "Peluquería",
        durationMin: 120,
        price: 80,
        businessId: business.id,
      },
      {
        name: "Limpieza Facial",
        description: "Limpieza profunda, exfoliación, extracción y mascarilla hidratante.",
        category: "Estética",
        durationMin: 60,
        price: 55,
        businessId: business.id,
      },
      {
        name: "Diseño de Cejas",
        description: "Perfilado y diseño según la morfología del rostro, con pinza o hilo.",
        category: "Estética",
        durationMin: 20,
        price: 15,
        businessId: business.id,
      },
    ],
  });

  console.log("✅ Negocio creado:", business.name);
  console.log("✅ Usuario creado:", user.email);
  console.log("✅ 4 clientes creados");
  console.log("✅ 3 colaboradores creados");
  console.log("✅ 5 servicios creados");

  // Obtenemos IDs para crear las citas
  const [valeria] = await prisma.client.findMany({ where: { name: "Valeria Morales", businessId: business.id } });
  const [carlos] = await prisma.client.findMany({ where: { name: "Carlos Gómez", businessId: business.id } });
  const [elena] = await prisma.collaborator.findMany({ where: { name: "Elena Rodriguez", businessId: business.id } });
  const [corteClasico] = await prisma.service.findMany({ where: { name: "Corte Clásico", businessId: business.id } });
  const [tinte] = await prisma.service.findMany({ where: { name: "Tinte Completo", businessId: business.id } });

  const today = new Date();
  today.setHours(10, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(10, 45, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(16, 0, 0, 0);

  const [apt1] = await Promise.all([
    prisma.appointment.create({
      data: {
        startTime: today,
        endTime: todayEnd,
        status: "CONFIRMED",
        price: corteClasico.price,
        businessId: business.id,
        clientId: valeria.id,
        collaboratorId: elena.id,
        serviceId: corteClasico.id,
      },
    }),
    prisma.appointment.create({
      data: {
        startTime: tomorrow,
        endTime: tomorrowEnd,
        status: "PENDING",
        price: tinte.price,
        businessId: business.id,
        clientId: carlos.id,
        collaboratorId: elena.id,
        serviceId: tinte.id,
      },
    }),
  ]);

  console.log("✅ 2 citas creadas (ID primera cita:", apt1.id + ")");
  console.log("");
  console.log("📋 Credenciales de prueba:");
  console.log("   Email:    ana@glowmanager.com");
  console.log("   Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
