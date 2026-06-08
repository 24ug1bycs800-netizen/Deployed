ALTER TABLE "shows" ADD COLUMN "language" varchar(100);

UPDATE "shows"
SET "language" = "movies"."language"
FROM "movies"
WHERE "shows"."movie_id" = "movies"."id";

UPDATE "shows"
SET "language" = 'Hindi'
WHERE "language" IS NULL;

ALTER TABLE "shows" ALTER COLUMN "language" SET NOT NULL;
