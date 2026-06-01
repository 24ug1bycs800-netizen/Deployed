CREATE TABLE "seat_locks" (
	"id" serial PRIMARY KEY NOT NULL,
	"seat_id" integer NOT NULL,
	"show_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "method" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "razorpay_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "razorpay_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "seat_locks" ADD CONSTRAINT "seat_locks_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "public"."seats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_locks" ADD CONSTRAINT "seat_locks_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_locks" ADD CONSTRAINT "seat_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;