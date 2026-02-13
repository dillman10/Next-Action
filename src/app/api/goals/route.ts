import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import {
  createGoalForUser,
  goalInputSchema,
  listGoalsForUser,
} from "@/lib/goals";

export async function GET() {
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await listGoalsForUser(userId);
  return NextResponse.json({ goals });
}

export async function POST(request: Request) {
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

  const goal = await createGoalForUser(userId, parsed.data);
  return NextResponse.json({ goal }, { status: 201 });
}

