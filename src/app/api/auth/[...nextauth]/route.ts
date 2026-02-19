import NextAuth from "next-auth";
import authOptions from "@/auth.config";

const handler = NextAuth(authOptions);

// NextAuth needs GET (signin page, callbacks) and POST (signin/email submit).
// Export all methods so no request gets 405 from Next.js.
export const GET = handler;
export const POST = handler;
export const HEAD = handler;
export const OPTIONS = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;


