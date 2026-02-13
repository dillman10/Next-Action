import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import {
  archiveGoalForUser,
  goalInputSchema,
  updateGoalForUser,
} from "@/lib/goals";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = goalInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const goal = await updateGoalForUser(userId, id, parsed.data);
  return NextResponse.json({ goal });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goal = await archiveGoalForUser(userId, id);
  return NextResponse.json({ goal });
}

