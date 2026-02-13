import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import { getOnboardingStatus, listInterestsForUser } from "@/lib/interests";
import { OnboardingInterestsForm } from "./onboarding-interests-form";

export default async function OnboardingInterestsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/onboarding/interests");
  }

  const userId = (session as any).user?.id as string;
  const { completed } = await getOnboardingStatus(userId);
  const initialInterests = completed
    ? (await listInterestsForUser(userId)).map((r) => r.label)
    : [];

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-h1">
            {completed ? "Edit your interests" : "What are you interested in?"}
          </h1>
          <p className="text-body text-muted-foreground">
            We’ll use this to suggest relevant next actions. You can change it
            later.
          </p>
        </div>
        <OnboardingInterestsForm
          isEditing={completed}
          initialInterests={initialInterests}
        />
      </main>
    </div>
  );
}
