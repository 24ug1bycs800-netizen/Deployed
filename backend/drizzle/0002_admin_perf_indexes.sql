CREATE INDEX "shows_movie_id_idx" ON "shows" USING btree ("movie_id");--> statement-breakpoint
CREATE INDEX "shows_screen_id_idx" ON "shows" USING btree ("screen_id");--> statement-breakpoint
CREATE INDEX "shows_date_idx" ON "shows" USING btree ("date");--> statement-breakpoint
CREATE INDEX "bookings_show_id_idx" ON "bookings" USING btree ("show_id");
