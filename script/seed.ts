import 'dotenv/config';
import { db } from "../server/db";
import { users } from "../shared/schema";
import { hashPassword } from "../server/auth";

async function main() {
  try {
    console.log("Starting seed process...");

    // 1. Seed Users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      const hashedPassword = await hashPassword("password123");
      await db.insert(users).values([
        { username: "admin", email: "admin@example.com", passwordHash: hashedPassword },
        { username: "user", email: "user@example.com", passwordHash: hashedPassword },
      ]);
      console.log("✓ Users seeded");
    } else {
      console.log("Users already exist, skipping.");
    }

    console.log("Seed process completed successfully.");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

main();
