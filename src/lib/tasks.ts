import { z } from "zod";

import { prisma } from "@/lib/db";
import { parseTimeInputOrNumber } from "@/lib/time";

export const taskInputSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    notes: z.string().max(4000).optional(),
    goalId: z.string().optional(),
    estimatedMinutes: z.number().int().positive().max(24 * 60).optional(),
    estimatedInput: z.string().max(50).optional(),
    priority: z.number().int().min(1).max(5).optional(),
    urgency: z.number().int().min(1).max(5).optional(),
    deadlineAt: z
      .string()
      .datetime()
      .transform((value) => new Date(value))
      .optional(),
  })
  .transform((data) => {
    const minutes =
      data.estimatedMinutes != null
        ? parseTimeInputOrNumber(data.estimatedMinutes)
        : data.estimatedInput != null && data.estimatedInput !== ""
          ? parseTimeInputOrNumber(data.estimatedInput)
          : null;
    const raw =
      data.estimatedInput != null && data.estimatedInput.trim() !== ""
        ? data.estimatedInput.trim()
        : null;
    return {
      ...data,
      estimatedMinutes: minutes ?? undefined,
      estimatedInput: raw,
    };
  });

export type TaskInput = z.infer<typeof taskInputSchema>;

export async function listTasksForUser(userId: string) {
  return prisma.task.findMany({
    where: {
      userId,
      status: "todo",
    },
    orderBy: [
      { deadlineAt: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      goal: true,
    },
  });
}

export async function createTaskForUser(userId: string, input: TaskInput) {
  return prisma.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes ?? null,
      goalId: input.goalId,
      estimatedMinutes: input.estimatedMinutes ?? null,
      estimatedInput: input.estimatedInput ?? null,
      priority: input.priority,
      urgency: input.urgency,
      deadlineAt: input.deadlineAt,
      status: "todo",
    },
  });
}

export async function updateTaskForUser(
  userId: string,
  id: string,
  input: TaskInput,
) {
  return prisma.task.update({
    where: {
      id,
      userId,
    },
    data: {
      title: input.title,
      notes: input.notes ?? null,
      goalId: input.goalId,
      estimatedMinutes: input.estimatedMinutes ?? null,
      estimatedInput: input.estimatedInput ?? null,
      priority: input.priority,
      urgency: input.urgency,
      deadlineAt: input.deadlineAt,
    },
  });
}

export async function archiveTaskForUser(userId: string, id: string) {
  return prisma.task.update({
    where: {
      id,
      userId,
    },
    data: {
      status: "archived",
    },
  });
}

