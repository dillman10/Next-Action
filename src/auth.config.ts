import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Resend } from "resend";

import { prisma } from "@/lib/db";
import { logEnvWarningsIfNeeded } from "@/lib/env-check";

logEnvWarningsIfNeeded();

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
          console.error("[auth] Missing env — add RESEND_API_KEY to .env and restart dev server.");
          throw new Error(
            "Sign-in email is not configured. Please contact the site owner.",
          );
        }

        const fromRaw = process.env.RESEND_FROM_EMAIL?.trim();
        const from = fromRaw || "onboarding@resend.dev";
        if (!fromRaw) {
          console.warn("[auth] RESEND_FROM_EMAIL not set; using onboarding@resend.dev. Set RESEND_FROM_EMAIL in .env for production.");
        }

        const resend = new Resend(apiKey);

        console.info("[Resend] send attempt: to=", identifier, "from=", from);

        const result = await resend.emails.send({
          from,
          to: identifier,
          subject: "Sign in to Next Action",
          text: `Sign in to Next Action Decision Assistant:\n\n${url}\n\nThis link will expire soon.`,
          html: `<p>Sign in to Next Action: <a href="${url}">Click here to sign in</a>. Link expires soon.</p>`,
        });

        console.info("[Resend] full response:", JSON.stringify({ data: result.data, error: result.error }));

        if (result.error) {
          const err = result.error as { message?: string };
          const msg = (err?.message ?? "").toLowerCase();
          if (msg.includes("not verified") || msg.includes("domain") || msg.includes("from")) {
            console.error(
              "[Resend] Sender/domain issue. Verify the sender domain at https://resend.com/domains and set RESEND_FROM_EMAIL to an address on that domain.",
            );
          } else if (msg.includes("api") || msg.includes("key") || msg.includes("unauthorized") || msg.includes("invalid")) {
            console.error("[Resend] API key issue. Check RESEND_API_KEY is valid and has send permission.");
          }
          console.error("[Resend] send failed — structured error:", JSON.stringify(result.error));
          throw new Error("We couldn't send the sign-in email. Please try again later.");
        }
        console.info("[Resend] send ok, id:", result.data?.id ?? "unknown");
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

