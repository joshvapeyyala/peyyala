ALTER TABLE "messages" ADD COLUMN "sender_hash" text;--> statement-breakpoint
CREATE INDEX "messages_sender_created_idx" ON "messages" USING btree ("sender_hash","created_at");