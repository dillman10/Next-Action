import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth.config";
import {
  listInterestsForUser,
  setInterestsForUser,
  markOnboardingComplete,
  getOnboardingStatus,
} from "@/lib/interests";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [interests, status] = await Promise.all([
    listInterestsForUser(userId),
    getOnboardingStatus(userId),
  ]);

  return NextResponse.json({
    interests: interests.map((r) => r.label),
    onboardingCompleted: status.completed,
  });
}

const postBodySchema = z.object({
  interests: z.array(z.string().max(100)).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = postBodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.interests != null) {
    await setInterestsForUser(userId, parsed.data.interests);
  }
  await markOnboardingComplete(userId);

  return NextResponse.json({ ok: true });
}
