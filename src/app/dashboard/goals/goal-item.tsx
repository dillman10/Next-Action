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

type GoalItemProps = {
  goal: {
    id: string;
    title: string;
    description: string | null;
  };
};

export function GoalItem({ goal }: GoalItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Remove this goal? It will be hidden from your list. Tasks under it will keep their link but the goal won’t show in filters.",
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to remove goal");
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
            <CardTitle>{goal.title}</CardTitle>
            {goal.description && (
              <CardDescription className="mt-1 text-small">
                {goal.description}
              </CardDescription>
            )}
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
