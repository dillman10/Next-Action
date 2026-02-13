import { z } from "zod";

import { prisma } from "@/lib/db";

export const goalInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

export type GoalInput = z.infer<typeof goalInputSchema>;

export async function listGoalsForUser(userId: string) {
  return prisma.goal.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createGoalForUser(userId: string, input: GoalInput) {
  return prisma.goal.create({
    data: {
      userId,
      title: input.title,
      description: input.description ?? null,
    },
  });
}

export async function updateGoalForUser(
  userId: string,
  id: string,
  input: GoalInput,
) {
  return prisma.goal.update({
    where: {
      id,
      userId,
    },
    data: {
      title: input.title,
      description: input.description ?? null,
    },
  });
}

export async function archiveGoalForUser(userId: string, id: string) {
  return prisma.goal.update({
    where: {
      id,
      userId,
    },
    data: {
      isActive: false,
    },
  });
}

