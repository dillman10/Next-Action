"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatTimeMinutes } from "@/lib/time";
import {
  ContextForm,
  type RecommendationResponse,
} from "./context-form";

export function DashboardClient() {
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  function handleRecommendation(response: RecommendationResponse) {
    setResult(response);
    setAddedMessage(null);
  }

  async function handleAddToTasks() {
    if (!result || !("type" in result) || result.type !== "generated") return;

    setIsAdding(true);
    setAddedMessage(null);
    try {
      const res = await fetch(
        `/api/recommendations/generated/${result.recommendationId}/confirm`,
        { method: "POST" },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add to tasks");
      }

      setAddedMessage("Added. It's in your Tasks list.");
      setResult(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleSkip() {
    if (!result || !("type" in result) || result.type !== "generated") return;

    setIsSkipping(true);
    try {
      const res = await fetch(
        `/api/recommendations/generated/${result.recommendationId}/skip`,
        { method: "POST" },
      );

      if (!res.ok) {
        throw new Error("Failed to skip");
      }

      setResult(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSkipping(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Set your context</CardTitle>
          <CardDescription>
            Share your time, energy, and focus so we can suggest one thing to do next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContextForm onRecommendation={handleRecommendation} />
        </CardContent>
      </Card>

      {addedMessage && (
        <p className="text-sm text-muted-foreground">{addedMessage}</p>
      )}

      {result && "type" in result && result.type === "generated" && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Your next action</CardTitle>
            <CardDescription>
              Suggested for you; not on your list yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                AI-suggested
              </span>
            </div>
            <div>
              <h3 className="text-h2">{result.generatedTask.title}</h3>
              <p className="mt-1 text-body font-medium text-muted-foreground">
                Do this next: {result.generatedTask.nextAction}
              </p>
              <p className="mt-2 text-body text-muted-foreground">
                Why now: {result.generatedTask.reasoning}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-small text-muted-foreground">
              <span>About {formatTimeMinutes(result.generatedTask.estimatedMinutes)}</span>
              {result.generatedTask.tags?.length > 0 && (
                <>
                  <span>·</span>
                  <span>{result.generatedTask.tags.join(", ")}</span>
                </>
              )}
              <span>·</span>
              <span
                className={`rounded px-2 py-0.5 ${
                  result.generatedTask.confidence === "high"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : result.generatedTask.confidence === "med"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                }`}
              >
                {result.generatedTask.confidence} confidence
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddToTasks}
                disabled={isAdding || isSkipping}
                loading={isAdding}
              >
                {isAdding ? "Adding…" : "Add to my tasks"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isAdding || isSkipping}
                loading={isSkipping}
              >
                {isSkipping ? "Skipping…" : "Skip"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && "fallback" in result && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {result.fallback.message}
              {result.fallback.deterministicIdea ? (
                <>{" "}<span className="font-medium text-foreground">{result.fallback.deterministicIdea}</span></>
              ) : null}
            </p>
          </CardContent>
        </Card>
      )}

      {result && "dailyLimitReached" in result && result.dailyLimitReached && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {"message" in result ? result.message : "You've reached your 5 AI suggestions for today. Try again tomorrow."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
