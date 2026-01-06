import { payment, imageTask, imageTaskInput, imageTaskOutput } from "./schema";

export type Payment = typeof payment.$inferSelect;

export type ImageTask = typeof imageTask.$inferSelect;
export type ImageTaskInput = typeof imageTaskInput.$inferSelect;
export type ImageTaskOutput = typeof imageTaskOutput.$inferSelect;

export type NewImageTask = typeof imageTask.$inferInsert;
export type NewImageTaskInput = typeof imageTaskInput.$inferInsert;
export type NewImageTaskOutput = typeof imageTaskOutput.$inferInsert;
