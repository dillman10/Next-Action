"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTimeMinutes } from "@/lib/time";

type TaskItemProps = {
  task: {
    id: string;
    title: string;
    notes: string | null;
    estimatedMinutes: number | null;
    priority: number | null;
    deadlineAt: Date | null;
    goal: { title: string } | null;
  };
};

export function TaskItem({ task }: TaskItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this task? It will be removed from your list.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete task");
        return;
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle>{task.title}</CardTitle>
            {task.notes && (
              <CardDescription className="mt-1 text-small">
                {task.notes}
              </CardDescription>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-small text-muted-foreground">
              {task.goal && (
                <span className="rounded bg-muted px-2 py-0.5">
                  {task.goal.title}
                </span>
              )}
              {task.estimatedMinutes != null && (
                <span>~{formatTimeMinutes(task.estimatedMinutes)}</span>
              )}
              {task.priority != null && (
                <span>Priority: {task.priority}/5</span>
              )}
              {task.deadlineAt && (
                <span>
                  Due: {new Date(task.deadlineAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
          >
            {isDeleting ? "Removing…" : "Delete"}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
