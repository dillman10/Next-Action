-- CreateEnum
CREATE TYPE "ContextUniqueness" AS ENUM ('familiar', 'related', 'novel');

-- AlterTable
ALTER TABLE "GeneratedSuggestion" ADD COLUMN     "contextUniqueness" "ContextUniqueness" DEFAULT 'related';
