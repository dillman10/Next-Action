import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth.config";
import { listInterestsForUser } from "@/lib/interests";
import { parseTimeInput } from "@/lib/time";
import { isTooSimilar, getUniquenessThreshold } from "@/lib/similarity";
import { canUseGeneratedSuggestion } from "@/lib/llm/generated-quota";
import { getGeneratedSuggestion } from "@/lib/llm/generate-suggestion";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.recommendationEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          notes: true,
        },
      },
    },
  });

  return NextResponse.json({ events });
}

const recommendationRequestSchema = z.object({
  timeMinutes: z.number().int().positive().max(24 * 60 * 30).optional(),
  timeInput: z.string().optional(),
  energy: z.enum(["low", "med", "high"]),
  uniqueness: z.enum(["familiar", "related", "novel"]),
  ideaHint: z
    .string()
    .max(500)
    .optional()
    .transform((s) => (s != null && s.trim() === "" ? undefined : s?.trim())),
}).refine(
  (data) => {
    if (data.timeInput != null && data.timeInput.trim() !== "") {
      const parsed = parseTimeInput(data.timeInput);
      return parsed != null;
    }
    return data.timeMinutes != null;
  },
  { message: "Provide timeMinutes or valid timeInput (e.g. 45m, 2h, 1d)" },
);

function resolveTimeMinutes(body: z.infer<typeof recommendationRequestSchema>): number | null {
  if (body.timeInput != null && body.timeInput.trim() !== "") {
    return parseTimeInput(body.timeInput);
  }
  if (body.timeMinutes != null) {
    return body.timeMinutes;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = recommendationRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const timeMinutes = resolveTimeMinutes(parsed.data);
  if (timeMinutes == null) {
    return NextResponse.json(
      { error: "Provide timeMinutes or valid timeInput (e.g. 45m, 2h, 1d)" },
      { status: 400 },
    );
  }

  const context = {
    timeMinutes,
    energy: parsed.data.energy,
    uniqueness: parsed.data.uniqueness,
    ideaHint: parsed.data.ideaHint ?? undefined,
  };

  const allowed = await canUseGeneratedSuggestion(userId);
  if (!allowed) {
    return NextResponse.json(
      {
        dailyLimitReached: true,
        message:
          "You've reached your 5 AI suggestions for today. Try again tomorrow.",
      },
      { status: 200 },
    );
  }

  const [
    userInterestsRows,
    allTasksForInterests,
    recentEvents,
    recentGenerated,
    existingTaskTitles,
    recentSuggestionTexts,
  ] = await Promise.all([
    listInterestsForUser(userId),
    prisma.task.findMany({
      where: { userId, status: "todo" },
      select: { title: true, goal: { select: { title: true } } },
      take: 50,
    }),
    prisma.recommendationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { decision: true },
    }),
    prisma.generatedSuggestion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { decision: true, title: true, nextAction: true },
    }),
    prisma.task.findMany({
      where: { userId, status: "todo" },
      select: { title: true },
      take: 100,
    }),
    prisma.generatedSuggestion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true, nextAction: true },
    }),
  ]);

  const referenceTexts: string[] = [
    ...existingTaskTitles.map((t) => t.title).filter(Boolean),
    ...recentSuggestionTexts.flatMap((s) => [s.title, s.nextAction].filter(Boolean)),
  ];

  const accepted = recentEvents.filter((e) => e.decision === "accepted").length;
  const skipped = recentEvents.filter((e) => e.decision === "skipped").length;
  const genAccepted = recentGenerated.filter((e) => e.decision === "accepted").length;
  const genSkipped = recentGenerated.filter((e) => e.decision === "skipped").length;
  const recentBehaviorSummary = `Last 10 (existing recs): ${accepted} accepted, ${skipped} skipped. Last 10 (generated): ${genAccepted} accepted, ${genSkipped} skipped. No task titles.`;

  const interestLabels = userInterestsRows.map((r) => r.label);
  const taskThemes = allTasksForInterests.map(
    (t) => (t.goal ? `${t.title} (${t.goal.title})` : t.title),
  );
  const taskThemesText =
    taskThemes.length > 0
      ? ` Recent task themes: ${taskThemes.slice(0, 10).join("; ")}.`
      : "";

  const userInterestsSummary =
    interestLabels.length > 0
      ? `interests: [${interestLabels.slice(0, 20).join(", ")}].${taskThemesText}`
      : `Interests: not set. Use safe default themes: small project progress, quick life admin, learning. Suggest a broad, low-risk next action. If relevant, you may mention that adding interests in the app will improve suggestions.${taskThemesText}`;

  let outcome = await getGeneratedSuggestion(
    {
      timeMinutes: context.timeMinutes,
      energy: context.energy,
      uniqueness: context.uniqueness,
      ideaHint: context.ideaHint,
    },
    userInterestsSummary,
    recentBehaviorSummary,
  );

  if (!outcome.success) {
    return NextResponse.json(
      {
        fallback: outcome.fallback,
      },
      { status: 200 },
    );
  }

  const uniquenessThreshold = getUniquenessThreshold(context.uniqueness);
  let data = outcome.data;
  if (
    isTooSimilar(
      data.generatedTask.title,
      data.generatedTask.nextAction,
      referenceTexts,
      uniquenessThreshold,
    )
  ) {
    const retryOutcome = await getGeneratedSuggestion(
      {
        timeMinutes: context.timeMinutes,
        energy: context.energy,
        uniqueness: context.uniqueness,
        ideaHint: context.ideaHint,
      },
      userInterestsSummary,
      recentBehaviorSummary,
      referenceTexts,
    );
    if (!retryOutcome.success) {
      return NextResponse.json(
        {
          fallback: {
            message:
              "I couldn't find a truly new idea right now. Try adjusting your interests or time window.",
            deterministicIdea: "",
          },
        },
        { status: 200 },
      );
    }
    data = retryOutcome.data;
    if (
      isTooSimilar(
        data.generatedTask.title,
        data.generatedTask.nextAction,
        referenceTexts,
        uniquenessThreshold,
      )
    ) {
      return NextResponse.json(
        {
          fallback: {
            message:
              "I couldn't find a truly new idea right now. Try adjusting your interests or time window.",
            deterministicIdea: "",
          },
        },
        { status: 200 },
      );
    }
  }

  const shortlistHash =
    data.meta?.shortlistHash ?? `${userId}-${new Date().toISOString().slice(0, 10)}`;

  const suggestion = await prisma.generatedSuggestion.create({
    data: {
      userId,
      contextTimeMinutes: context.timeMinutes,
      contextEnergy: context.energy,
      contextUrgency: "med", // Keep for backward compatibility
      contextUniqueness: context.uniqueness,
      title: data.generatedTask.title,
      nextAction: data.generatedTask.nextAction.slice(0, 120),
      estimatedMinutes: data.generatedTask.estimatedMinutes,
      tags: data.generatedTask.tags ?? [],
      reasoning: data.generatedTask.reasoning,
      confidence: data.generatedTask.confidence,
      model: data.model ?? "claude-sonnet",
      sourceFeatures: data.meta?.sourceFeatures ?? [],
      shortlistHash,
      decision: "pending",
    },
  });

  return NextResponse.json({
    type: "generated",
    recommendationId: suggestion.id,
    generatedTask: {
      title: data.generatedTask.title,
      nextAction: data.generatedTask.nextAction,
      estimatedMinutes: data.generatedTask.estimatedMinutes,
      tags: data.generatedTask.tags,
      reasoning: data.generatedTask.reasoning,
      confidence: data.generatedTask.confidence,
    },
    model: data.model,
    meta: data.meta,
  });
}
