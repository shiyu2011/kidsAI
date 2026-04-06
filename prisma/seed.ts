import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const email = "test@test.com";
  const password = "test1234";

  const existing = await prisma.parent.findUnique({ where: { email } });
  if (existing) {
    console.log(`Test account already exists: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const parent = await prisma.parent.create({
    data: {
      email,
      hashedPassword,
      coppaConsent: true,
    },
  });

  const child = await prisma.childProfile.create({
    data: {
      parentId: parent.id,
      displayName: "TestKid",
    },
  });

  console.log(`Created test account:`);
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  Child: ${child.displayName}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
