import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { user?: { id?: string } } | null)?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const suggestion = await prisma.generatedSuggestion.findFirst({
    where: { id, userId },
  });

  if (!suggestion || suggestion.decision !== "pending") {
    return NextResponse.json(
      { error: "Suggestion not found or already used" },
      { status: 404 },
    );
  }

  await prisma.generatedSuggestion.update({
    where: { id },
    data: { decision: "skipped" },
  });

  return NextResponse.json({ ok: true });
}
