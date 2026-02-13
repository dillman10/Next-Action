import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";

import { prisma } from "@/lib/db";

const e2eTestMode = process.env.E2E_TEST_MODE === "1";
const e2eTestSecret = process.env.E2E_TEST_SECRET;
const E2E_TEST_EMAIL = "test@example.com";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(e2eTestMode && e2eTestSecret
      ? [
          CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              if (
                !credentials?.email ||
                credentials.email !== E2E_TEST_EMAIL ||
                credentials.password !== e2eTestSecret
              ) {
                return null;
              }
              const user = await prisma.user.upsert({
                where: { email: E2E_TEST_EMAIL },
                create: { email: E2E_TEST_EMAIL, name: "E2E Test User" },
                update: {},
              });
              return { id: user.id, email: user.email, name: user.name };
            },
          }),
        ]
      : []),
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.error("RESEND_API_KEY is not set");
          throw new Error(
            "Magic link email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL in your environment.",
          );
        }

        const from =
          process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

        const resend = new Resend(apiKey);

        await resend.emails.send({
          from,
          to: identifier,
          subject: "Sign in to Next Action",
          text: `Sign in to Next Action Decision Assistant:\n\n${url}\n\nThis link will expire soon.`,
          html: `
            <p>Sign in to <strong>Next Action Decision Assistant</strong>:</p>
            <p><a href="${url}">Click here to sign in</a></p>
            <p>This link will expire soon.</p>
          `,
        });
      },
    }),
  ],
  session: {
    strategy: e2eTestMode ? "jwt" : "database",
  },
  callbacks: {
    ...(e2eTestMode
      ? {
          jwt: ({ token, user }) => {
            if (user) (token as { id?: string }).id = user.id;
            return token;
          },
          session: ({ session, token }) => {
            if (session.user) {
              session.user.id = (token as { id?: string }).id ?? (token.sub as string) ?? "";
            }
            return session;
          },
        }
      : {
          session: ({ session, user }) => {
            if (session.user) session.user.id = user.id;
            return session;
          },
        }),
  },
};

export default authOptions;

