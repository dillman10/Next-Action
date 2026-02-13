import { prisma } from "@/lib/db";

export async function listInterestsForUser(
  userId: string,
): Promise<{ label: string }[]> {
  const rows = await prisma.userInterest.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { label: true },
  });
  return rows;
}

export async function setInterestsForUser(
  userId: string,
  labels: string[],
): Promise<void> {
  const trimmed = labels
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  // Case-insensitive dedupe: keep first occurrence's casing
  const byLower = new Map<string, string>();
  for (const label of trimmed) {
    const key = label.toLowerCase();
    if (!byLower.has(key)) byLower.set(key, label);
  }
  const unique = Array.from(byLower.values());

  await prisma.userInterest.deleteMany({ where: { userId } });
  if (unique.length > 0) {
    await prisma.userInterest.createMany({
      data: unique.map((label) => ({ userId, label })),
      skipDuplicates: true,
    });
  }
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: new Date() },
  });
}

export async function getOnboardingStatus(userId: string): Promise<{
  completed: boolean;
  interestsCount: number;
}> {
  const [user, count] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompletedAt: true },
    }),
    prisma.userInterest.count({ where: { userId } }),
  ]);
  return {
    completed: user?.onboardingCompletedAt != null,
    interestsCount: count,
  };
}
