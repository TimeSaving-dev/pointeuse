import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.isActive) {
            return null;
          }

          if (user.accountStatus === "PENDING") {
            throw new Error("AccountPending");
          }

          if (user.accountStatus === "REJECTED") {
            throw new Error("AccountRejected");
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            isAdmin: user.isAdmin,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          if (error instanceof Error && 
             (error.message === "AccountPending" || 
              error.message === "AccountRejected")) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 jours (réduit pour améliorer la sécurité)
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.SECURE_COOKIES === "true",
        domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Laisser undefined pour utiliser le domaine par défaut
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.SECURE_COOKIES === "true",
        domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Laisser undefined pour utiliser le domaine par défaut
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.SECURE_COOKIES === "true",
        domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Laisser undefined pour utiliser le domaine par défaut
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 