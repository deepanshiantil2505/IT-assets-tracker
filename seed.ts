import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: { name: "Alex Admin", email: "admin@company.com", passwordHash: password, role: "ADMIN", department: "IT" },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@company.com" },
    update: {},
    create: { name: "Priya Agent", email: "agent@company.com", passwordHash: password, role: "AGENT", department: "IT" },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@company.com" },
    update: {},
    create: { name: "Sam Employee", email: "employee@company.com", passwordHash: password, role: "EMPLOYEE", department: "Sales" },
  });

  const laptop = await prisma.asset.upsert({
    where: { assetTag: "AST-1001" },
    update: {},
    create: {
      assetTag: "AST-1001",
      name: "MacBook Pro 14\"",
      category: "Laptop",
      serialNumber: "C02XG2JHMD6M",
      status: "IN_USE",
      purchaseDate: new Date("2024-01-15"),
      ownerId: employee.id,
    },
  });

  await prisma.asset.upsert({
    where: { assetTag: "AST-1002" },
    update: {},
    create: {
      assetTag: "AST-1002",
      name: "Dell UltraSharp Monitor",
      category: "Monitor",
      serialNumber: "DU27-88213",
      status: "IN_STORAGE",
      purchaseDate: new Date("2023-11-02"),
    },
  });

  await prisma.ticket.create({
    data: {
      title: "MacBook battery draining fast",
      description: "Battery drops from 100% to 20% within two hours of light use.",
      status: "OPEN",
      priority: "HIGH",
      requesterId: employee.id,
      assetId: laptop.id,
    },
  });

  await prisma.ticket.create({
    data: {
      title: "Need access to shared drive",
      description: "Requesting read/write access to the Sales team shared drive.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      requesterId: employee.id,
      assigneeId: agent.id,
    },
  });

  console.log("Seed complete. Login with:");
  console.log("  admin@company.com / Password123!");
  console.log("  agent@company.com / Password123!");
  console.log("  employee@company.com / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
