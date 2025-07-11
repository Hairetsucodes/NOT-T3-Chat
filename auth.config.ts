import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSchema } from "@/schemas/login";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";
import Google from "next-auth/providers/google";
import Github from "next-auth/providers/github";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Github({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        try {
          const validatedFields = CredentialsSchema.safeParse(credentials);
          if (!validatedFields.success) {
            console.error("Validation failed:", validatedFields.error);
            return null;
          }

          const { email, password } = validatedFields.data;
          const user = await getUserByEmail(email);

          if (!user) {
            console.error("User not found for email:", email);
            return null;
          }

          if (!user.password) {
            console.error("User has no password:", email);
            return null;
          }

          const passwordMatch = await bcrypt.compare(password, user.password);

          if (passwordMatch) {
            // Return only the necessary user data
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              username: user.username,
            };
          }

          console.error("Password mismatch for user:", email);
          return null;
        } catch (error) {
          console.error("Authorization error:", error);
          if (error instanceof Error) {
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
} as NextAuthConfig;
