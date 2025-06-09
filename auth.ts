import NextAuth, { DefaultSession } from "next-auth";
import * as jose from "jose";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import authConfig from "./auth.config";

export const runtime = "nodejs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      authToken: string;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    newUser: "/auth/new-user",
  },
  callbacks: {
    async signIn() {
      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.authToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;
      token.id = token.sub;

      const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
      const authToken = await new jose.SignJWT({
        userId: token.sub,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(secret);

      token.jwt = authToken;
      token.authToken = authToken;

      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
});
