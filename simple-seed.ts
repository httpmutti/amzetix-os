import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: "postgresql://neondb_owner:npg_XN7KywE0lsfk@ep-holy-math-av7tqaw0.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Connecting...");
  const hash = await bcrypt.hash("password123", 12);
  console.log("Creating user...");
  await prisma.user.create({
    data: {
      name: "Ahmed Khan",
      email: "owner@agencyos.com",
      password: hash,
      role: "OWNER",
      isActive: true,
    }
  });
  console.log("Done! User created.");
}

main()
  .catch(e => console.error("Error:", e))
  .finally(() => prisma.$disconnect());