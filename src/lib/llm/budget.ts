import { prisma } from "@/lib/db";

const DAILY_CAP = 10;

/** Start of day in UTC for the given date. */
function dayStart(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

/** Returns remaining LLM calls for today; if at or over cap, returns 0. */
export async function getRemainingLLMCount(userId: string): Promise<number> {
  const today = dayStart(new Date());
  const row = await (prisma as any).lLMBudget.findUnique({
    where: {
      userId_day: { userId, day: today },
    },
  });
  const used = row?.count ?? 0;
  return Math.max(0, DAILY_CAP - used);
}

/** Returns true if user has not reached daily cap. */
export async function canUseLLM(userId: string): Promise<boolean> {
  return (await getRemainingLLMCount(userId)) > 0;
}

/** Increment LLM usage for today. Call only after a successful LLM request. */
export async function incrementLLMBudget(userId: string): Promise<void> {
  const today = dayStart(new Date());
  await (prisma as any).lLMBudget.upsert({
    where: {
      userId_day: { userId, day: today },
    },
    create: { userId, day: today, count: 1 },
    update: { count: { increment: 1 } },
  });
}
