import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import { getOnboardingStatus } from "@/lib/interests";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const userId = (session as any).user?.id as string;
    const { completed } = await getOnboardingStatus(userId);
    redirect(completed ? "/dashboard" : "/onboarding/interests");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-[var(--space-section)] rounded-[var(--radius-lg)] border bg-card/60 p-8 shadow-sm">
        <section className="space-y-[var(--space-paragraph)]">
          <p className="text-small font-medium uppercase tracking-wide text-muted-foreground">
            Next Action Decision Assistant
          </p>
          <h1 className="text-h1">
            Decide what to work on next, without the spiral.
          </h1>
          <p className="text-body text-muted-foreground">
            A calm space to list tasks, set your constraints, and get one clear recommendation for what to do right now.
          </p>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className="w-full sm:w-auto">
            <a href="/api/auth/signin">Sign in with email</a>
          </Button>
          <p className="text-small text-muted-foreground">
            Just you and your next step.
          </p>
        </section>
      </main>
    </div>
  );
}
