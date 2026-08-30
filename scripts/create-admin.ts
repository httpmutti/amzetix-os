import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const email = "ahmed@amzetix.com";
  const password = "Syed@99.";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hash, role: "ADMIN", isActive: true },
    });
    console.log("✓ Updated existing user to ADMIN:", email);
  } else {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        name: "Ahmed",
        email,
        password: hash,
        role: "ADMIN",
        isActive: true,
      },
    });
    console.log("✓ Created ADMIN user:", email);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect?.());
