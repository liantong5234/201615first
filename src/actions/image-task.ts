'use server';

import { getDb } from '@/db';
import { imageTask, imageTaskInput, imageTaskOutput } from '@/db/schema';
import type {
  ImageTask,
  ImageTaskInput,
  ImageTaskOutput,
  NewImageTask,
  NewImageTaskInput,
  NewImageTaskOutput,
} from '@/db/types';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Create a new image task
 */
export async function createImageTask(
  data: Omit<NewImageTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ImageTask> {
  const db = await getDb();
  const id = randomUUID();
  const now = new Date();

  const [task] = await db
    .insert(imageTask)
    .values({
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    } as any)
    .returning();

  return task;
}

/**
 * Update image task status
 */
export async function updateImageTaskStatus(
  taskId: string,
  status: string,
  errorMessage?: string,
  processingTimeMs?: number,
  creditsUsed?: number
): Promise<void> {
  const db = await getDb();

  await db
    .update(imageTask)
    .set({
      status,
      errorMessage,
      processingTimeMs,
      creditsUsed,
      updatedAt: new Date(),
    } as any)
    .where(eq(imageTask.id, taskId));
}

/**
 * Create image task input
 */
export async function createImageTaskInput(
  data: Omit<NewImageTaskInput, 'id' | 'createdAt'>
): Promise<ImageTaskInput> {
  const db = await getDb();
  const id = randomUUID();

  const [input] = await db
    .insert(imageTaskInput)
    .values({
      id,
      ...data,
      createdAt: new Date(),
    } as any)
    .returning();

  return input;
}

/**
 * Create image task output
 */
export async function createImageTaskOutput(
  data: Omit<NewImageTaskOutput, 'id' | 'createdAt'>
): Promise<ImageTaskOutput> {
  const db = await getDb();
  const id = randomUUID();

  const [output] = await db
    .insert(imageTaskOutput)
    .values({
      id,
      ...data,
      createdAt: new Date(),
    } as any)
    .returning();

  return output;
}

/**
 * Get image task by ID with inputs and outputs
 */
export async function getImageTaskWithDetails(taskId: string): Promise<{
  task: ImageTask;
  inputs: ImageTaskInput[];
  outputs: ImageTaskOutput[];
} | null> {
  const db = await getDb();

  const [task] = await db
    .select()
    .from(imageTask)
    .where(eq(imageTask.id, taskId));

  if (!task) {
    return null;
  }

  const inputs = await db
    .select()
    .from(imageTaskInput)
    .where(eq(imageTaskInput.taskId, taskId))
    .orderBy(imageTaskInput.sortOrder);

  const outputs = await db
    .select()
    .from(imageTaskOutput)
    .where(eq(imageTaskOutput.taskId, taskId))
    .orderBy(imageTaskOutput.sortOrder);

  return { task, inputs, outputs };
}

/**
 * Get recent tasks for a user
 */
export async function getRecentImageTasks(
  userId: string,
  limit = 10
): Promise<ImageTask[]> {
  const db = await getDb();

  const tasks = await db
    .select()
    .from(imageTask)
    .where(eq(imageTask.userId, userId))
    .orderBy(desc(imageTask.createdAt))
    .limit(limit);

  return tasks;
}

/**
 * Get all image tasks (for anonymous users or admin)
 */
export async function getAllRecentImageTasks(limit = 10): Promise<ImageTask[]> {
  const db = await getDb();

  const tasks = await db
    .select()
    .from(imageTask)
    .orderBy(desc(imageTask.createdAt))
    .limit(limit);

  return tasks;
}

/**
 * Delete image task and related data
 */
export async function deleteImageTask(taskId: string): Promise<void> {
  const db = await getDb();

  // Cascade delete will handle inputs and outputs
  await db.delete(imageTask).where(eq(imageTask.id, taskId));
}

/**
 * Get task inputs by task ID
 */
export async function getImageTaskInputs(taskId: string): Promise<ImageTaskInput[]> {
  const db = await getDb();

  return db
    .select()
    .from(imageTaskInput)
    .where(eq(imageTaskInput.taskId, taskId))
    .orderBy(imageTaskInput.sortOrder);
}

/**
 * Get task outputs by task ID
 */
export async function getImageTaskOutputs(taskId: string): Promise<ImageTaskOutput[]> {
  const db = await getDb();

  return db
    .select()
    .from(imageTaskOutput)
    .where(eq(imageTaskOutput.taskId, taskId))
    .orderBy(imageTaskOutput.sortOrder);
}

