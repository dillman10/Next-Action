import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/auth.config";
import { listGoalsForUser } from "@/lib/goals";
import { listTasksForUser } from "@/lib/tasks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskForm } from "./task-form";
import { TaskItem } from "./task-item";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/tasks");
  }

  const userId = (session as any)?.user?.id as string;
  const [tasks, goals] = await Promise.all([
    listTasksForUser(userId),
    listGoalsForUser(userId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">Tasks</h1>
          <p className="text-body text-muted-foreground">
            Add tasks and link them to goals. Only active tasks are shown.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a new task</CardTitle>
          <CardDescription>
            Tasks are what you&rsquo;ll get recommendations for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm goals={goals} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-h2">
          Your tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-body text-muted-foreground">
            No tasks yet. Create one above to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
