import mongoose from "mongoose";
import { hash } from "bcryptjs";
import { UserModel } from "../models/user";

async function main() {
  const uri = process.env.MONGODB_URL?.trim();
  const dbName = process.env.MONGODB_DB?.trim();
  const email = process.env.super_admin_email?.trim().toLowerCase();
  const password = process.env.super_admin_password;

  if (!uri || !dbName) {
    throw new Error("MONGODB_URL and MONGODB_DB must be set in the environment.");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("A valid super_admin_email is required in the environment.");
  }

  if (
    !password ||
    Buffer.byteLength(password, "utf8") < 12 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error("super_admin_password must be between 12 and 72 bytes.");
  }

  await mongoose.connect(uri, { dbName });

  try {
    const passwordHash = await hash(password, 12);
    await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          passwordHash,
          role: "super_admin",
          isActive: true,
        },
        $setOnInsert: {
          email,
          name: "Super Admin",
        },
      },
      {
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    process.stdout.write("Super Admin account provisioned successfully.\n");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Super Admin provisioning failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
