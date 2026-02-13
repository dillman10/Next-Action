import { prisma } from "@/lib/db";

const DAILY_CAP = 5;

/** Start of day in UTC. */
function dayStart(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

/** Returns true if user has not reached the daily cap for generated suggestions (5/day). */
export async function canUseGeneratedSuggestion(userId: string): Promise<boolean> {
  const today = dayStart(new Date());
  const count = await prisma.generatedSuggestion.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });
  return count < DAILY_CAP;
}

/** Returns remaining generated-suggestion slots for today (0 if at or over cap). */
export async function getRemainingGeneratedCount(userId: string): Promise<number> {
  const today = dayStart(new Date());
  const count = await prisma.generatedSuggestion.count({
    where: {
      userId,
      createdAt: { gte: today },
    },
  });
  return Math.max(0, DAILY_CAP - count);
}
