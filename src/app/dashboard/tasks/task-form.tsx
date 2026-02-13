"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Goal = {
  id: string;
  title: string;
};

export function TaskForm({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [goalId, setGoalId] = useState("");
  const [estimatedInput, setEstimatedInput] = useState("");
  const [priority, setPriority] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const body: any = {
        title,
        notes: notes || undefined,
        goalId: goalId || undefined,
      };

      if (estimatedInput.trim()) {
        body.estimatedInput = estimatedInput.trim();
      }
      if (priority) {
        body.priority = parseInt(priority, 10);
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      setTitle("");
      setNotes("");
      setGoalId("");
      setEstimatedInput("");
      setPriority("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
          placeholder="e.g., Write recommendation rules"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={4000}
          rows={3}
          className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
          placeholder="Any additional context..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="goalId" className="text-sm font-medium">
            Goal (optional)
          </label>
          <select
            id="goalId"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
          >
            <option value="">None</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="estimatedInput" className="text-sm font-medium">
            Time estimate (optional)
          </label>
          <input
            id="estimatedInput"
            type="text"
            value={estimatedInput}
            onChange={(e) => setEstimatedInput(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
            placeholder="e.g. 45m, 2h, 1d"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            Priority 1-5 (optional)
          </label>
          <input
            id="priority"
            type="number"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            min="1"
            max="5"
            className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
            placeholder="1-5"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" loading={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create task"}
      </Button>
    </form>
  );
}
