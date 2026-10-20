import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel, userRoles, type UserRole } from "@/models/user";

function isUserRole(role: unknown): role is UserRole {
  return typeof role === "string" && userRoles.some((knownRole) => knownRole === role);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email kerja", type: "email" },
        password: { label: "Kata sandi", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const email =
          typeof credentials.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        await connectToDatabase();
        const user = await UserModel.findOne({
          email,
          isActive: true,
        }).select("+passwordHash");

        if (!user || !(await compare(password, user.passwordHash))) {
          return null;
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user && isUserRole(user.role)) {
        token.role = user.role;
      }

      return token;
    },
    session({ session, token }) {
      if (!session.user || !token.sub || !isUserRole(token.role)) {
        throw new Error("The authenticated session is missing user details.");
      }

      session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    },
  },
});
