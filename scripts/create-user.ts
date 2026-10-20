import { createInterface } from "node:readline/promises";
import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { UserModel, userRoles, type UserRole } from "../models/user";

function isUserRole(role: string): role is UserRole {
  return userRoles.some((knownRole) => knownRole === role);
}

function readPassword(prompt: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Run this command from an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk: Buffer) => {
      const character = chunk.toString("utf8");

      if (character === "\u0003") {
        finish();
        reject(new Error("Account creation cancelled."));
      } else if (character === "\r" || character === "\n") {
        finish();
        process.stdout.write("\n");
        resolve(value);
      } else if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
      } else {
        value += character;
        process.stdout.write("*");
      }
    };

    const finish = () => {
      process.stdin.off("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    process.stdout.write(prompt);
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  const uri = process.env.MONGODB_URL?.trim();
  const dbName = process.env.MONGODB_DB?.trim();

  if (!uri || !dbName) {
    throw new Error("MONGODB_URL and MONGODB_DB must be set in the environment.");
  }

  await mongoose.connect(uri, { dbName });

  try {
    const adminExists = await UserModel.exists({ role: "admin" });
    const terminal = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      const name = (await terminal.question("Nama: ")).trim();
      const email = (await terminal.question("Email kerja: ")).trim().toLowerCase();
      let role: UserRole = "admin";

      if (adminExists) {
        const requestedRole = (
          await terminal.question("Role (admin/hr/manager): ")
        )
          .trim()
          .toLowerCase();

        if (!isUserRole(requestedRole)) {
          throw new Error("Role harus admin, hr, atau manager.");
        }

        role = requestedRole;
      } else {
        process.stdout.write("Akun ini akan menjadi Admin pertama.\n");
      }

      terminal.close();

      if (!name || name.length > 150) {
        throw new Error("Nama wajib diisi dan maksimal 150 karakter.");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        throw new Error("Email kerja tidak valid.");
      }

      if (await UserModel.exists({ email })) {
        throw new Error("Email kerja tersebut sudah terdaftar.");
      }

      const password = await readPassword("Kata sandi (12-72 byte): ");
      if (Buffer.byteLength(password, "utf8") < 12 ||
        Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("Kata sandi harus berukuran 12 sampai 72 byte.");
      }

      const passwordHash = await hash(password, 12);
      await UserModel.create({ name, email, role, passwordHash });
      process.stdout.write(`Akun ${role} berhasil dibuat.\n`);
    } finally {
      terminal.close();
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Account creation failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
