import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Setting up exclusive Amzetix admins and cleaning up all other users…");

  // 1. Password hashes
  const muttiHash = await bcrypt.hash("880Mutti@.", 10);
  const ahmedHash = await bcrypt.hash("Syed@99.", 10);

  // 2. Core Departments
  const mgmtDept = await prisma.department.upsert({
    where: { name: "Management" },
    update: {},
    create: { name: "Management", description: "Executive & Administration" },
  });

  await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering", description: "Software & Technology" },
  });

  await prisma.department.upsert({
    where: { name: "Design" },
    update: {},
    create: { name: "Design", description: "UI/UX & Creative" },
  });

  await prisma.department.upsert({
    where: { name: "Operations" },
    update: {},
    create: { name: "Operations", description: "Business Operations & Project Management" },
  });

  // 3. Standard Leave Types
  const standardLeaveTypes = [
    { name: "Annual Leave", daysAllowed: 20, isPaid: true, description: "Standard paid annual leave" },
    { name: "Sick Leave", daysAllowed: 10, isPaid: true, description: "Medical & health leave" },
    { name: "Casual Leave", daysAllowed: 5, isPaid: true, description: "Urgent personal affairs" },
    { name: "Unpaid Leave", daysAllowed: 0, isPaid: false, description: "Unpaid leave of absence" },
  ];

  for (const lt of standardLeaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt,
    });
  }

  // 4. Create/Upsert Admin 1: mutti@amzetix.com
  const muttiUser = await prisma.user.upsert({
    where: { email: "mutti@amzetix.com" },
    update: {
      name: "Mutti",
      password: muttiHash,
      role: "OWNER",
      isActive: true,
    },
    create: {
      name: "Mutti",
      email: "mutti@amzetix.com",
      password: muttiHash,
      role: "OWNER",
      isActive: true,
    },
  });

  // 5. Create/Upsert Admin 2: ahmed@amzetix.com
  const ahmedUser = await prisma.user.upsert({
    where: { email: "ahmed@amzetix.com" },
    update: {
      name: "Ahmed",
      password: ahmedHash,
      role: "OWNER",
      isActive: true,
    },
    create: {
      name: "Ahmed",
      email: "ahmed@amzetix.com",
      password: ahmedHash,
      role: "OWNER",
      isActive: true,
    },
  });

  const allowedUserIds = [muttiUser.id, ahmedUser.id];

  // 6. Delete all other users and employees FIRST to clear any EMP-001/EMP-002 conflicts
  await prisma.employee.deleteMany({
    where: {
      userId: { notIn: allowedUserIds },
    },
  });

  await prisma.session.deleteMany({
    where: { userId: { notIn: allowedUserIds } },
  });

  await prisma.account.deleteMany({
    where: { userId: { notIn: allowedUserIds } },
  });

  await prisma.auditLog.deleteMany({
    where: { performedById: { notIn: allowedUserIds } },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: { notIn: allowedUserIds },
    },
  });
  console.log(`🧹 Cleaned up ${deletedUsers.count} other user accounts.`);

  // 7. Upsert Employee Profiles for the 2 Admins
  await prisma.employee.upsert({
    where: { userId: muttiUser.id },
    update: {
      firstName: "Mutti",
      lastName: "Ullah",
      position: "Co-Founder / Owner",
      departmentId: mgmtDept.id,
      status: "ACTIVE",
    },
    create: {
      employeeId: "EMP-001",
      userId: muttiUser.id,
      firstName: "Mutti",
      lastName: "Ullah",
      position: "Co-Founder / Owner",
      departmentId: mgmtDept.id,
      joiningDate: new Date(),
      employmentType: "FULL_TIME",
      baseSalary: 0,
      currency: "USD",
      status: "ACTIVE",
    },
  });

  await prisma.employee.upsert({
    where: { userId: ahmedUser.id },
    update: {
      firstName: "Ahmed",
      lastName: "Syed",
      position: "Co-Founder / Owner",
      departmentId: mgmtDept.id,
      status: "ACTIVE",
    },
    create: {
      employeeId: "EMP-002",
      userId: ahmedUser.id,
      firstName: "Ahmed",
      lastName: "Syed",
      position: "Co-Founder / Owner",
      departmentId: mgmtDept.id,
      joiningDate: new Date(),
      employmentType: "FULL_TIME",
      baseSalary: 0,
      currency: "USD",
      status: "ACTIVE",
    },
  });

  // 8. Core Company Settings
  const defaultSettings: Array<{ key: string; value: object }> = [
    { key: "company_name", value: { name: "AMZETIX" } },
    { key: "company_currency", value: { currency: "USD" } },
    { key: "work_hours", value: { defaultDailyHours: 8, workingDaysPerWeek: 5 } },
    { key: "invoice_settings", value: { prefix: "INV-", defaultPaymentTermsDays: 30 } },
  ];

  for (const s of defaultSettings) {
    await prisma.companySetting.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        value: s.value,
      },
    });
  }

  console.log("✅ Admin Setup Complete!");
  console.log("──────────────────────────────────────────────────");
  console.log("1. mutti@amzetix.com  |  Password: 880Mutti@.");
  console.log("2. ahmed@amzetix.com  |  Password: Syed@99.");
  console.log("──────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
