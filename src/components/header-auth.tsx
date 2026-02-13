"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeaderAuth({
  session,
}: {
  session: { user?: { name?: string | null } } | null;
}) {
  if (session) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        Sign out
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/api/auth/signin">Sign in</Link>
    </Button>
  );
}
