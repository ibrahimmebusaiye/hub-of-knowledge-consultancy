import "dotenv/config";
import argon2 from "argon2";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient, AdminRole } from "@prisma/client";
import { createAdminSchema } from "../lib/validation";

const db = new PrismaClient();

async function main() {
  const reader = createInterface({ input: stdin, output: stdout });
  const existingCount = await db.admin.count();
  const name = (await reader.question("Administrator name: ")).trim();
  const emailArgument = process.argv.find((argument) => argument.startsWith("--email="))?.slice(8);
  const email = emailArgument ?? (await reader.question("Administrator email: ")).trim();
  reader.close();
  const password = process.env.ADMIN_CREATE_PASSWORD ?? await readSecret("Temporary password: ");
  const role = existingCount === 0 ? AdminRole.OWNER : AdminRole.ADMIN;
  const input = createAdminSchema.parse({ name, email, password, role });
  const admin = await db.admin.create({ data: { name: input.name, email: input.email, passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }), role, mustChangePassword: true } });
  await db.auditLog.create({ data: { adminId: admin.id, action: existingCount === 0 ? "INITIAL_ADMIN_CREATED_CLI" : "ADMIN_CREATED_CLI", targetType: "Admin", targetId: admin.id } });
  stdout.write(`\nCreated ${role.toLowerCase()} account for ${admin.email}.\n`);
}

function readSecret(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") throw new Error("An interactive terminal is required. Set ADMIN_CREATE_PASSWORD temporarily for non-interactive use.");
  stdout.write(prompt); stdin.setRawMode(true); stdin.resume(); stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    function onData(character: string) {
      if (character === "\u0003") { cleanup(); reject(new Error("Cancelled.")); return; }
      if (character === "\r" || character === "\n") { cleanup(); stdout.write("\n"); resolve(value); return; }
      if (character === "\u007f" || character === "\b") { value = value.slice(0, -1); return; }
      if (character >= " ") value += character;
    }
    function cleanup() { stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); }
    stdin.on("data", onData);
  });
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => db.$disconnect());
