-- CreateEnum
CREATE TYPE "GeneratedSuggestionDecision" AS ENUM ('pending', 'accepted', 'skipped');

-- CreateTable
CREATE TABLE "GeneratedSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextTimeMinutes" INTEGER NOT NULL,
    "contextEnergy" "ContextEnergy" NOT NULL,
    "contextUrgency" "ContextUrgency" NOT NULL,
    "title" TEXT NOT NULL,
    "nextAction" VARCHAR(120) NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "tags" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sourceFeatures" JSONB NOT NULL,
    "shortlistHash" TEXT,
    "decision" "GeneratedSuggestionDecision" NOT NULL DEFAULT 'pending',
    "createdTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneratedSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GeneratedSuggestion_userId_createdAt_idx" ON "GeneratedSuggestion"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GeneratedSuggestion" ADD CONSTRAINT "GeneratedSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
