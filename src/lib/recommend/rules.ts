import { prisma } from "@/lib/db";

export type ContextEnergy = "low" | "med" | "high";
export type ContextUrgency = "low" | "med" | "high";

export type Context = {
  timeMinutes: number;
  energy: ContextEnergy;
  urgency: ContextUrgency;
};

type TaskWithScore = {
  id: string;
  title: string;
  notes: string | null;
  estimatedMinutes: number | null;
  priority: number | null;
  urgency: number | null;
  deadlineAt: Date | null;
  score: number;
};

const NOTE_TRUNCATE = 150;
const SHORTLIST_SIZE = 30;
/** Default estimate when task has none (for time-fit band only). */
const DEFAULT_ESTIMATE_MINUTES = 30;

export type TimeFitBand = "best" | "good" | "ok" | "short" | "over";

/**
 * Time-fit band: 70-100% = best, 50-70% = good, 30-50% = ok, <30% = short, >100% = over.
 */
export function getTimeFitBand(
  estimatedMinutes: number,
  contextTimeMinutes: number,
): TimeFitBand {
  if (contextTimeMinutes <= 0) return "ok";
  const ratio = estimatedMinutes / contextTimeMinutes;
  if (ratio > 1) return "over";
  if (ratio >= 0.7) return "best";
  if (ratio >= 0.5) return "good";
  if (ratio >= 0.3) return "ok";
  return "short";
}

/**
 * Score for time fit only (strict time awareness): best +35, good +20, ok +8, short 0, over -15.
 */
function timeFitScore(
  estimatedMinutes: number,
  contextTimeMinutes: number,
): number {
  const band = getTimeFitBand(estimatedMinutes, contextTimeMinutes);
  switch (band) {
    case "best":
      return 35;
    case "good":
      return 20;
    case "ok":
      return 8;
    case "short":
      return 0;
    case "over":
      return -15;
  }
}

function scoreTask(
  task: {
    deadlineAt: Date | null;
    priority: number | null;
    urgency: number | null;
    estimatedMinutes: number | null;
  },
  context: Context,
): number {
  let score = 0;

  if (task.deadlineAt) {
    const now = new Date();
    const deadline = new Date(task.deadlineAt);
    const hoursUntilDeadline =
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilDeadline < 0) score += 50;
    else if (hoursUntilDeadline < 24) score += 40;
    else if (hoursUntilDeadline < 48) score += 30;
    else if (hoursUntilDeadline < 168) score += 20;
    else score += 10;
  }
  if (task.priority) score += task.priority * 5;
  if (task.urgency) score += task.urgency * 5;

  const est = task.estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES;
  score += timeFitScore(est, context.timeMinutes);

  if (context.energy === "low" && task.estimatedMinutes) {
    if (task.estimatedMinutes <= 30) score += 15;
    else if (task.estimatedMinutes > 60) score -= 5;
  } else if (context.energy === "high" && task.estimatedMinutes && task.estimatedMinutes >= 60) {
    score += 10;
  }
  if (context.urgency === "high" && task.urgency && task.urgency >= 4) {
    score += 15;
  }
  return score;
}

/** Tasks with estimated time in [30%, 105%] of context are "time reasonable". */
function isTimeReasonable(
  estimatedMinutes: number | null,
  contextTimeMinutes: number,
): boolean {
  const est = estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES;
  const min = contextTimeMinutes * 0.3;
  const max = contextTimeMinutes * 1.05;
  return est >= min && est <= max;
}

/** Returns top N scored tasks with compact fields for LLM (notes truncated). */
export async function getScoredShortlist(
  userId: string,
  context: Context,
  n: number = SHORTLIST_SIZE,
  excludeTaskId?: string | null,
) {
  const tasks = await prisma.task.findMany({
    where: { userId, status: "todo" },
    include: { goal: true },
  });

  if (tasks.length === 0) return [];

  const timeReasonable = tasks.filter((t) =>
    isTimeReasonable(t.estimatedMinutes, context.timeMinutes),
  );
  const toScore = timeReasonable.length > 0 ? timeReasonable : tasks;

  const scored: TaskWithScore[] = toScore.map((task) => ({
    id: task.id,
    title: task.title,
    notes: task.notes,
    estimatedMinutes: task.estimatedMinutes,
    priority: task.priority,
    urgency: task.urgency,
    deadlineAt: task.deadlineAt,
    score: scoreTask(task, context),
  }));

  scored.sort((a, b) => b.score - a.score);

  const filtered =
    excludeTaskId && scored.length > 1
      ? scored.filter((t) => t.id !== excludeTaskId)
      : scored;
  function serializeTask(t: TaskWithScore) {
    return {
      id: t.id,
      title: t.title,
      notes: t.notes ? t.notes.slice(0, NOTE_TRUNCATE) + (t.notes.length > NOTE_TRUNCATE ? "…" : "") : null,
      estimatedMinutes: t.estimatedMinutes,
      priority: t.priority,
      urgency: t.urgency,
      deadlineAt: t.deadlineAt ? t.deadlineAt.toISOString() : null,
    };
  }
  if (filtered.length === 0) return scored.slice(0, n).map(serializeTask);
  return filtered.slice(0, n).map(serializeTask);
}

const BAND_ORDER: TimeFitBand[] = ["best", "good", "ok", "short"];

export async function getDeterministicRecommendation(
  userId: string,
  context: Context,
  excludeTaskId?: string | null,
) {
  const tasks = await prisma.task.findMany({
    where: { userId, status: "todo" },
    include: { goal: true },
  });

  if (tasks.length === 0) return null;

  const timeReasonable = tasks.filter((t) =>
    isTimeReasonable(t.estimatedMinutes, context.timeMinutes),
  );
  const toScore = timeReasonable.length > 0 ? timeReasonable : tasks;

  const scoredTasks: TaskWithScore[] = toScore.map((task) => ({
    id: task.id,
    title: task.title,
    notes: task.notes,
    estimatedMinutes: task.estimatedMinutes,
    priority: task.priority,
    urgency: task.urgency,
    deadlineAt: task.deadlineAt,
    score: scoreTask(task, context),
  }));

  scoredTasks.sort((a, b) => b.score - a.score);

  let candidates = scoredTasks;
  if (excludeTaskId && candidates.length > 1) {
    candidates = candidates.filter((t) => t.id !== excludeTaskId);
  }

  const topTask = pickBestByTimeBand(candidates, context.timeMinutes);
  if (!topTask) return null;

  const reasons: string[] = [];
  if (topTask.deadlineAt) {
    const hoursUntilDeadline =
      (new Date(topTask.deadlineAt).getTime() - new Date().getTime()) /
      (1000 * 60 * 60);
    if (hoursUntilDeadline < 24) reasons.push("due soon");
  }
  if (topTask.priority && topTask.priority >= 4) reasons.push("high priority");
  const est = topTask.estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES;
  const band = getTimeFitBand(est, context.timeMinutes);
  if (band === "best" || band === "good") reasons.push("fits your available time");
  if (context.energy === "low" && topTask.estimatedMinutes && topTask.estimatedMinutes <= 30) {
    reasons.push("quick task for low energy");
  }

  const explanation =
    reasons.length > 0
      ? `Recommended because it's ${reasons.join(", ")}.`
      : "Recommended based on your priorities and context.";

  return {
    taskId: topTask.id,
    taskTitle: topTask.title,
    taskNotes: topTask.notes,
    explanation,
    confidence: "med" as const,
    score: topTask.score,
  };
}

function pickBestByTimeBand(
  scored: TaskWithScore[],
  contextTimeMinutes: number,
): TaskWithScore | null {
  for (const band of BAND_ORDER) {
    const est = (t: TaskWithScore) => t.estimatedMinutes ?? DEFAULT_ESTIMATE_MINUTES;
    const inBand = scored.find(
      (t) => getTimeFitBand(est(t), contextTimeMinutes) === band,
    );
    if (inBand) return inBand;
  }
  return scored[0] ?? null;
}
