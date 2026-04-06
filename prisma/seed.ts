import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function seedAccount(
  email: string,
  password: string,
  isAdmin: boolean,
  childName?: string
) {
  const existing = await prisma.parent.findUnique({ where: { email } });
  if (existing) {
    // Ensure admin flag is up to date
    if (existing.isAdmin !== isAdmin) {
      await prisma.parent.update({
        where: { email },
        data: { isAdmin },
      });
      console.log(`  Updated ${email} admin=${isAdmin}`);
    } else {
      console.log(`  Already exists: ${email} (admin=${existing.isAdmin})`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const parent = await prisma.parent.create({
    data: {
      email,
      hashedPassword,
      coppaConsent: true,
      isAdmin,
    },
  });

  if (childName) {
    await prisma.childProfile.create({
      data: { parentId: parent.id, displayName: childName },
    });
  }

  console.log(`  Created: ${email} (admin=${isAdmin}${childName ? `, child=${childName}` : ""})`);
}

async function main() {
  console.log("Seeding accounts...");

  // Admin account (credentials from env vars)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await seedAccount(adminEmail, adminPassword, true);
  } else {
    console.log("  Skipping admin account (set ADMIN_EMAIL and ADMIN_PASSWORD env vars)");
  }

  // Test account for dev
  await seedAccount("test@test.com", "test1234", false, "TestKid");

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
