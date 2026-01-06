import { type AspectRatio, type Img2ImgModel } from '@/ai/image/lib/img2img-types';
import {
  createImageTask,
  createImageTaskInput,
  getImageTaskWithDetails,
  getAllRecentImageTasks,
} from '@/actions/image-task';
import { requireSession, unauthorizedResponse } from '@/lib/require-session';
import { uploadFile, getPublicUrl } from '@/storage';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Create a new image task
 * POST /api/img2img/task
 */
export async function POST(req: NextRequest) {
  // Protected API route: validate session
  const session = await requireSession(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const formData = await req.formData();

    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as Img2ImgModel;
    const aspectRatio = formData.get('aspectRatio') as AspectRatio;
    const numOutputs = Number.parseInt(formData.get('numOutputs') as string, 10) as 1 | 2 | 4;

    // Validate required fields
    if (!prompt || !model || !aspectRatio || !numOutputs) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, model, aspectRatio, numOutputs' },
        { status: 400 }
      );
    }

    // Get uploaded files
    const files = formData.getAll('images') as File[];
    if (files.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    // Create the task
    const task = await createImageTask({
      prompt,
      model,
      aspectRatio,
      numOutputs,
      status: 'pending',
      provider: 'replicate',
      modelId: 'prunaai/z-image-turbo-img2img',
    } as any);

    // Upload input images to R2 and create database records
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Validate file size (24MB max)
      if (file.size > 24 * 1024 * 1024) {
        continue;
      }

      // Upload to R2
      const buffer = Buffer.from(await file.arrayBuffer());
      const { key } = await uploadFile(
        buffer,
        file.name,
        file.type,
        `image-tasks/inputs/${task.id}`
      );

      // Create input record
      await createImageTaskInput({
        taskId: task.id,
        storageKey: key,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sortOrder: i,
      } as any);
    }

    console.log(`[img2img] Task created [taskId=${task.id}]`);

    return NextResponse.json({
      success: true,
      taskId: task.id,
    });
  } catch (error) {
    console.error('[img2img] Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

/**
 * Get task details or list recent tasks
 * GET /api/img2img/task?id=xxx or GET /api/img2img/task
 */
export async function GET(req: NextRequest) {
  // Protected API route: validate session
  const session = await requireSession(req);
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');

    if (taskId) {
      // Get specific task with details
      const result = await getImageTaskWithDetails(taskId);

      if (!result) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        task: result.task,
        inputs: result.inputs,
        outputs: result.outputs,
      });
    }

    // Get recent tasks with their outputs
    const tasks = await getAllRecentImageTasks(20);

    // Fetch outputs for each task and convert to public URLs
    const tasksWithOutputs = await Promise.all(
      tasks.map(async (task) => {
        const details = await getImageTaskWithDetails(task.id);
        const outputs = (details?.outputs || []).map((output) => ({
          ...output,
          imageUrl: getPublicUrl(output.storageKey),
        }));
        return {
          ...task,
          outputs,
        };
      })
    );

    return NextResponse.json({
      success: true,
      tasks: tasksWithOutputs,
    });
  } catch (error) {
    console.error('[img2img] Error getting task:', error);
    return NextResponse.json(
      { error: 'Failed to get task' },
      { status: 500 }
    );
  }
}

