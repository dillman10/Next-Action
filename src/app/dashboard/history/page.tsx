import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/auth.config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatTimeMinutes } from "@/lib/time";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/dashboard/history");
  }

  const userId = (session as any)?.user?.id as string;
  const events = await prisma.recommendationEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          notes: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1">
            Recommendation History
          </h1>
          <p className="text-body text-muted-foreground">
            Your recent recommendations and decisions.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">← Dashboard</Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-body text-muted-foreground">
            No recommendations yet. Get your first recommendation from the
            dashboard.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>
                      {event.task.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-small">
                      {event.explanation}
                    </CardDescription>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      event.decision === "accepted"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : event.decision === "skipped"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {event.decision === "accepted"
                      ? "Accepted"
                      : event.decision === "skipped"
                        ? "Skipped"
                        : "Recommended"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-small text-muted-foreground">
                  <span>
                    Time: {event.contextTimeMinutes != null ? formatTimeMinutes(event.contextTimeMinutes) : "—"}
                  </span>
                  <span>
                    Energy: {event.contextEnergy}
                  </span>
                  <span>
                    Urgency: {event.contextUrgency}
                  </span>
                  <span>
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
