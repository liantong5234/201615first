import {
  type Img2ImgModel,
  type ReplicatePredictionRequest,
  type ReplicatePredictionResponse,
  IMG2IMG_MODEL_CONFIGS,
} from './img2img-types';

const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';
const REPLICATE_TIMEOUT_MS = 120 * 1000; // 2 minutes
const POLL_INTERVAL_MS = 1000; // 1 second polling interval

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll prediction status until completed
 */
async function pollPrediction(
  predictionUrl: string,
  apiToken: string,
  timeoutMs: number
): Promise<ReplicatePredictionResponse> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(predictionUrl, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate API poll error: ${response.status} - ${errorText}`);
    }

    const result = (await response.json()) as ReplicatePredictionResponse;

    if (result.status === 'succeeded' || result.status === 'failed' || result.status === 'canceled') {
      return result;
    }

    // Still processing, wait before polling again
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('Prediction timed out');
}

/**
 * Call Replicate API to generate image from image
 */
export async function generateImg2Img(params: {
  imageUrl: string;
  prompt: string;
  model: Img2ImgModel;
  outputFormat?: 'jpg' | 'png' | 'webp';
}): Promise<{ imageUrl: string; predictTime?: number }> {
  const { imageUrl, prompt, model, outputFormat = 'jpg' } = params;

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }

  const config = IMG2IMG_MODEL_CONFIGS[model];

  const requestBody: ReplicatePredictionRequest = {
    version: config.version,
    input: {
      image: imageUrl,
      prompt,
      strength: config.defaultStrength,
      lora_scales: config.defaultLoraScales,
      output_format: outputFormat,
      guidance_scale: config.defaultGuidanceScale,
      output_quality: config.defaultOutputQuality,
      num_inference_steps: config.defaultInferenceSteps,
    },
  };

  // Create prediction
  const response = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60', // Wait up to 60 seconds
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
  }

  let result = (await response.json()) as ReplicatePredictionResponse;

  // If prediction is still running, poll for completion
  if (result.status === 'starting' || result.status === 'processing') {
    const predictionUrl = result.urls?.get || `${REPLICATE_API_URL}/${result.id}`;
    console.log(`[img2img] Prediction still running, polling [id=${result.id}]`);
    result = await pollPrediction(predictionUrl, apiToken, REPLICATE_TIMEOUT_MS);
  }

  if (result.status === 'failed') {
    throw new Error(`Prediction failed: ${result.error || 'Unknown error'}`);
  }

  if (result.status === 'canceled') {
    throw new Error('Prediction was canceled');
  }

  if (result.status !== 'succeeded') {
    throw new Error(`Unexpected prediction status: ${result.status}`);
  }

  // Get the output image URL
  const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  if (!outputUrl) {
    throw new Error('No output image returned from Replicate');
  }

  return {
    imageUrl: outputUrl,
    predictTime: result.metrics?.predict_time,
  };
}

/**
 * Download image from URL and return as Buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Get content type from URL or default to jpeg
 */
export function getContentTypeFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

