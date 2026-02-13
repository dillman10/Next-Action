import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth.config";
import {
  createTaskForUser,
  listTasksForUser,
  taskInputSchema,
} from "@/lib/tasks";

export async function GET() {
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await listTasksForUser(userId);
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = taskInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const task = await createTaskForUser(userId, parsed.data);
  return NextResponse.json({ task }, { status: 201 });
}

