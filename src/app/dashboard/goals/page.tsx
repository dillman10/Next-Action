import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/auth.config";
import { listGoalsForUser } from "@/lib/goals";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalForm } from "./goal-form";
import { GoalItem } from "./goal-item";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/goals");
  }

  const userId = (session as any)?.user?.id as string;
  const goals = await listGoalsForUser(userId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Goals</h1>
          <p className="text-body text-muted-foreground">
            Organize your work into goals, then add tasks to each.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a new goal</CardTitle>
          <CardDescription>
            Goals help you group related tasks together.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoalForm />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-h2">
          Your goals ({goals.length})
        </h2>
        {goals.length === 0 ? (
          <p className="text-body text-muted-foreground">
            No goals yet. Create one above to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => (
              <GoalItem key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
