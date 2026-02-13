"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { parseTimeInput, formatTimeMinutes } from "@/lib/time";

export type RecommendationResponse =
  | { type: "generated"; recommendationId: string; generatedTask: GeneratedTask; model?: string; meta?: unknown }
  | { fallback: { message: string; deterministicIdea: string } }
  | { dailyLimitReached: true; message?: string };

export type GeneratedTask = {
  title: string;
  nextAction: string;
  estimatedMinutes: number;
  tags: string[];
  reasoning: string;
  confidence: "low" | "med" | "high";
};

export function ContextForm({
  onRecommendation,
}: {
  onRecommendation: (result: RecommendationResponse) => void;
}) {
  const [timeInput, setTimeInput] = useState("60");
  const [energy, setEnergy] = useState<"low" | "med" | "high">("med");
  const [uniqueness, setUniqueness] = useState<"familiar" | "related" | "novel">("related");
  const [hasIdea, setHasIdea] = useState(false);
  const [ideaHint, setIdeaHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedMinutes = parseTimeInput(timeInput);
  const timeDisplay = parsedMinutes != null ? formatTimeMinutes(parsedMinutes) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let timeMinutes: number;
      const fromParser = parseTimeInput(timeInput);
      if (fromParser != null) {
        timeMinutes = fromParser;
      } else {
        const num = parseFloat(timeInput.trim());
        if (!Number.isFinite(num) || num <= 0) {
          throw new Error("Enter time as a number or e.g. 45m, 2h, 1d");
        }
        timeMinutes = Math.round(num);
      }

      const body: Record<string, unknown> = {
          timeInput: timeInput.trim(),
          timeMinutes,
          energy,
          uniqueness,
        };
        if (hasIdea && ideaHint.trim()) {
          body.ideaHint = ideaHint.trim();
        }
        const res = await fetch("/api/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get suggestion");
      }

      const result = await res.json();
      onRecommendation(result as RecommendationResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="timeInput" className="text-sm font-medium">
          Available time *
        </label>
        <input
          id="timeInput"
          type="text"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          required
          className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
          placeholder="e.g. 45m, 2h, 1d or 60"
        />
        {timeDisplay != null && (
          <p className="text-xs text-muted-foreground">
            {timeDisplay}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Energy level *</label>
        <div className="flex gap-2">
          {(["low", "med", "high"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setEnergy(level)}
              className={`flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-[length:var(--text-body)] transition-colors duration-150 cursor-pointer [transition-timing-function:var(--ease-out)] ${
                energy === level
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Uniqueness *</label>
        <div className="flex gap-2">
          {([
            { value: "familiar", label: "Familiar" },
            { value: "related", label: "Related" },
            { value: "novel", label: "Novel" },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setUniqueness(value)}
              className={`flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-[length:var(--text-body)] transition-colors duration-150 cursor-pointer [transition-timing-function:var(--ease-out)] ${
                uniqueness === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Familiar: same kind of task I've done before. Related: similar/adjacent to what I've done. Novel: completely new task/skill I haven't tried.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Have an idea already?</label>
        <div className="flex gap-2">
          {(["No", "Yes"] as const).map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setHasIdea(choice === "Yes")}
              className={`flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-[length:var(--text-body)] transition-colors duration-150 cursor-pointer [transition-timing-function:var(--ease-out)] ${
                (choice === "Yes" && hasIdea) || (choice === "No" && !hasIdea)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
        {hasIdea && (
          <>
            <input
              type="text"
              value={ideaHint}
              onChange={(e) => setIdeaHint(e.target.value)}
              maxLength={500}
              className="w-full rounded-[var(--radius-md)] border border-input bg-background px-3 py-2 text-[length:var(--text-body)] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [transition-timing-function:var(--ease-out)]"
              placeholder="e.g. something outside, something productive, something relaxing"
            />
            <p className="text-xs text-muted-foreground">
              Optional: tell the assistant what kind of task you're in the mood for. It'll use this as a hint.
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" loading={isLoading} className="w-full cursor-pointer">
        {isLoading ? "Finding a suggestion for you…" : "Get recommendation"}
      </Button>
    </form>
  );
}
