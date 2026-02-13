"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_INTERESTS = [
  "building side projects",
  "coding",
  "design",
  "writing",
  "fitness",
  "reading",
  "music",
  "gaming",
  "cooking",
  "learning",
  "productivity",
  "entrepreneurship",
  "art",
  "photography",
  "volunteering",
  "outdoor time",
  "career prep",
  "personal finance",
  "mindfulness",
];

function normalizeKey(label: string): string {
  return label.trim().toLowerCase();
}

export function OnboardingInterestsForm({
  isEditing = false,
  initialInterests = [],
}: {
  isEditing?: boolean;
  initialInterests?: string[];
}) {
  const router = useRouter();
  const [list, setList] = useState<string[]>(
    initialInterests.map((l) => l.trim()).filter(Boolean),
  );
  const [customInput, setCustomInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFromInput = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const key = normalizeKey(trimmed);
    setList((prev) => {
      if (prev.some((l) => normalizeKey(l) === key)) return prev;
      return [...prev, trimmed];
    });
    setCustomInput("");
  }, [customInput]);

  const removeLabel = useCallback((label: string) => {
    const key = normalizeKey(label);
    setList((prev) => prev.filter((l) => normalizeKey(l) !== key));
  }, []);

  const addSuggestion = useCallback((label: string) => {
    const key = normalizeKey(label);
    setList((prev) => {
      if (prev.some((l) => normalizeKey(l) === key)) return prev;
      return [...prev, label];
    });
  }, []);

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: list }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/user/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: [] }),
      });
      if (!res.ok) throw new Error("Failed to continue");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="p-0 space-y-6">
        {/* Current interests as chips with x */}
        <div className="flex flex-wrap gap-2">
          {list.map((label) => (
            <span
              key={normalizeKey(label)}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {label}
              <button
                type="button"
                onClick={() => removeLabel(label)}
                className="ml-0.5 rounded-[var(--radius-lg)] p-0.5 hover:bg-primary-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground/40 cursor-pointer"
                aria-label={`Remove ${label}`}
              >
                <span className="sr-only">Remove</span>
                <span aria-hidden>×</span>
              </button>
            </span>
          ))}
        </div>

        {/* Add new interest */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Add an interest…"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFromInput();
              }
            }}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addFromInput}>
            Add
          </Button>
        </div>

        {/* Suggestions (first-time only) */}
        {!isEditing && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Or pick from suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_INTERESTS.map((label) => {
                const key = normalizeKey(label);
                const alreadyAdded = list.some((l) => normalizeKey(l) === key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addSuggestion(label)}
                    disabled={alreadyAdded}
                    className={`rounded-[var(--radius-lg)] px-4 py-2 text-sm font-medium transition-colors ${
                      alreadyAdded
                        ? "cursor-default bg-muted/50 text-muted-foreground"
                        : "cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {isEditing ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isSubmitting}
            loading={isSubmitting}
            >
              Skip for now
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? "Saving…" : isEditing ? "Save" : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
