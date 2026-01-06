CREATE TABLE "image_task" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"prompt" text NOT NULL,
	"model" text NOT NULL,
	"provider" text,
	"model_id" text,
	"aspect_ratio" text NOT NULL,
	"num_outputs" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"credits_used" integer,
	"error_message" text,
	"processing_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_task_input" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"file_type" text,
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "image_task_output" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "image_task_input" ADD CONSTRAINT "image_task_input_task_id_image_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."image_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image_task_output" ADD CONSTRAINT "image_task_output_task_id_image_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."image_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "image_task_user_id_idx" ON "image_task" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "image_task_status_idx" ON "image_task" USING btree ("status");--> statement-breakpoint
CREATE INDEX "image_task_created_at_idx" ON "image_task" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "image_task_input_task_id_idx" ON "image_task_input" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "image_task_output_task_id_idx" ON "image_task_output" USING btree ("task_id");