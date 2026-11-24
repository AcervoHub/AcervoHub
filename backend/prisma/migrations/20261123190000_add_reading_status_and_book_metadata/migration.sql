CREATE TYPE "BookReadingStatus" AS ENUM ('QUERO_LER', 'LIDOS');

ALTER TABLE "Book"
ADD COLUMN "subtitle" TEXT,
ADD COLUMN "publisher" TEXT,
ADD COLUMN "coverUrl" TEXT,
ADD COLUMN "pageCount" INTEGER,
ADD COLUMN "language" TEXT;

UPDATE "Book"
SET "coverUrl" = "thumbnail"
WHERE "thumbnail" IS NOT NULL;

ALTER TABLE "UserBook"
ADD COLUMN "status" "BookReadingStatus" NOT NULL DEFAULT 'QUERO_LER',
ADD COLUMN "startedAt" TIMESTAMP(3),
ADD COLUMN "finishedAt" TIMESTAMP(3);

ALTER TABLE "Review"
ALTER COLUMN "rating" DROP NOT NULL,
ADD COLUMN "comment" TEXT;
