ALTER TABLE "shows" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'active';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shows_status_idx" ON "shows" USING btree ("status");
