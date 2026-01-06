import {
  type AspectRatio,
  type Img2ImgModel,
  IMG2IMG_MODEL_CONFIGS,
} from '@/ai/image/lib/img2img-types';
import {
  downloadImage,
  generateImg2Img,
  getContentTypeFromUrl,
} from '@/ai/image/lib/img2img-service';
import {
  createImageTaskOutput,
  getImageTaskInputs,
  updateImageTaskStatus,
} from '@/actions/image-task';
import { requireSession, unauthorizedResponse } from '@/lib/require-session';
import { getPublicUrl, uploadFile } from '@/storage';
import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const TIMEOUT_MILLIS = 120 * 1000; // 2 minutes

interface Img2ImgRequestBody {
  taskId: string;
  prompt: string;
  model: Img2ImgModel;
  aspectRatio: AspectRatio;
  numOutputs: 1 | 2 | 4;
}

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMillis: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMillis)
    ),
  ]);
};

export async function POST(req: NextRequest) {
  // Protected API route: validate session
  const session = await requireSession(req);
  if (!session) {
    return unauthorizedResponse();
  }

  const requestId = randomUUID().slice(0, 8);
  const startTime = performance.now();

  try {
    const body = (await req.json()) as Img2ImgRequestBody;
    const { taskId, prompt, model, aspectRatio, numOutputs } = body;

    // Validate request
    if (!taskId || !prompt || !model || !aspectRatio || !numOutputs) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!IMG2IMG_MODEL_CONFIGS[model]) {
      return NextResponse.json(
        { error: 'Invalid model' },
        { status: 400 }
      );
    }

    console.log(
      `[img2img] Starting generation [requestId=${requestId}, taskId=${taskId}, model=${model}]`
    );

    // Update task status to processing
    await updateImageTaskStatus(taskId, 'processing');

    // Get input images from database
    const inputs = await getImageTaskInputs(taskId);
    if (inputs.length === 0) {
      await updateImageTaskStatus(taskId, 'failed', 'No input images found');
      return NextResponse.json(
        { error: 'No input images found for this task' },
        { status: 400 }
      );
    }

    // Get the first input image's public URL for Replicate API
    const firstInput = inputs[0];
    const imageUrl = getPublicUrl(firstInput.storageKey);

    console.log(
      `[img2img] Using image URL [requestId=${requestId}, url=${imageUrl}]`
    );

    const modelConfig = IMG2IMG_MODEL_CONFIGS[model];
    const outputImages: string[] = [];
    let totalProcessingTime = 0;

    // Generate images
    for (let i = 0; i < numOutputs; i++) {
      try {
        const result = await withTimeout(
          generateImg2Img({
            imageUrl,
            prompt,
            model,
            outputFormat: 'jpg',
          }),
          TIMEOUT_MILLIS
        );

        if (result.predictTime) {
          totalProcessingTime += result.predictTime * 1000;
        }

        // Download the generated image from Replicate's temporary URL
        const imageBuffer = await downloadImage(result.imageUrl);
        const contentType = getContentTypeFromUrl(result.imageUrl);

        // Upload to R2 storage
        const { key } = await uploadFile(
          imageBuffer,
          `output-${i}.jpg`,
          contentType,
          `image-tasks/outputs/${taskId}`
        );

        // Save output to database
        await createImageTaskOutput({
          taskId,
          storageKey: key,
          sortOrder: i,
        } as any);

        // Return public URL for direct CDN access
        const publicUrl = getPublicUrl(key);
        outputImages.push(publicUrl);

        console.log(
          `[img2img] Generated output ${i + 1}/${numOutputs} [requestId=${requestId}, key=${key}]`
        );
      } catch (error) {
        console.error(
          `[img2img] Error generating output ${i + 1} [requestId=${requestId}]:`,
          error
        );
        // Continue with other outputs if one fails
      }
    }

    if (outputImages.length === 0) {
      await updateImageTaskStatus(taskId, 'failed', 'Failed to generate any images');
      return NextResponse.json(
        { error: 'Failed to generate images' },
        { status: 500 }
      );
    }

    // Calculate credits used
    const creditsUsed = Math.round(modelConfig.creditsPerImage * outputImages.length * 10) / 10;

    // Update task status to completed
    const processingTimeMs = Math.round(performance.now() - startTime);
    await updateImageTaskStatus(
      taskId,
      'completed',
      undefined,
      processingTimeMs,
      creditsUsed
    );

    console.log(
      `[img2img] Completed [requestId=${requestId}, outputs=${outputImages.length}, elapsed=${(processingTimeMs / 1000).toFixed(1)}s]`
    );

    return NextResponse.json({
      success: true,
      taskId,
      outputs: outputImages,
      creditsUsed,
      processingTimeMs,
    });
  } catch (error) {
    console.error(`[img2img] Error [requestId=${requestId}]:`, error);

    return NextResponse.json(
      {
        error: 'Failed to generate image. Please try again later.',
      },
      { status: 500 }
    );
  }
}

