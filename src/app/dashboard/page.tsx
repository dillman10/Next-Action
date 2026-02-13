import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import { getOnboardingStatus } from "@/lib/interests";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const userId = (session as any).user?.id as string;
  const { completed, interestsCount } = await getOnboardingStatus(userId);
  if (!completed) {
    redirect("/onboarding/interests");
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {interestsCount === 0 && (
          <div className="rounded-[var(--radius-lg)] border bg-muted/50 px-4 py-3 text-body text-muted-foreground">
            Add interests to get better suggestions.{" "}
            <a
              href="/onboarding/interests"
              className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
            >
              Set your interests
            </a>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1">
              Your next action
            </h1>
            <p className="text-body text-muted-foreground">
              Set your context and get a recommendation for what to work on next.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard/goals">Goals</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard/tasks">Tasks</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/dashboard/history">History</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/onboarding/interests">Interests</a>
            </Button>
          </div>
        </div>

        <DashboardClient />
      </main>
    </div>
  );
}

