// Image to Image generation types

export type Img2ImgModel = 'max' | 'standard' | 'turbo';

export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Img2ImgRequest {
  prompt: string;
  model: Img2ImgModel;
  aspectRatio: AspectRatio;
  numOutputs: 1 | 2 | 4;
  inputImages: string[]; // storage keys of input images
}

export interface Img2ImgResponse {
  taskId: string;
  status: TaskStatus;
  outputImages?: string[]; // storage keys of output images
  error?: string;
}

// Replicate API types
export interface ReplicatePredictionInput {
  image: string;
  prompt: string;
  strength?: number;
  lora_scales?: number;
  output_format?: 'jpg' | 'png' | 'webp';
  guidance_scale?: number;
  output_quality?: number;
  num_inference_steps?: number;
}

export interface ReplicatePredictionRequest {
  version: string;
  input: ReplicatePredictionInput;
}

export interface ReplicatePredictionResponse {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  metrics?: {
    predict_time?: number;
  };
  urls?: {
    get?: string;
    cancel?: string;
  };
}

// Model configuration
export interface Img2ImgModelConfig {
  version: string;
  defaultStrength: number;
  defaultLoraScales: number;
  defaultGuidanceScale: number;
  defaultOutputQuality: number;
  defaultInferenceSteps: number;
  creditsPerImage: number;
}

export const IMG2IMG_MODEL_CONFIGS: Record<Img2ImgModel, Img2ImgModelConfig> = {
  max: {
    version: 'prunaai/z-image-turbo-img2img:5c958e90e0f904240629ee35c69196e3bd790b5528c0696705ebdb1656871dd8',
    defaultStrength: 0.6,
    defaultLoraScales: -0.03,
    defaultGuidanceScale: 0,
    defaultOutputQuality: 80,
    defaultInferenceSteps: 14,
    creditsPerImage: 1.5,
  },
  standard: {
    version: 'prunaai/z-image-turbo-img2img:5c958e90e0f904240629ee35c69196e3bd790b5528c0696705ebdb1656871dd8',
    defaultStrength: 0.5,
    defaultLoraScales: -0.03,
    defaultGuidanceScale: 0,
    defaultOutputQuality: 70,
    defaultInferenceSteps: 10,
    creditsPerImage: 1.0,
  },
  turbo: {
    version: 'prunaai/z-image-turbo-img2img:5c958e90e0f904240629ee35c69196e3bd790b5528c0696705ebdb1656871dd8',
    defaultStrength: 0.7,
    defaultLoraScales: -0.03,
    defaultGuidanceScale: 0,
    defaultOutputQuality: 60,
    defaultInferenceSteps: 6,
    creditsPerImage: 0.5,
  },
};

// Aspect ratio to dimensions mapping
export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '2:3': { width: 832, height: 1248 },
  '3:2': { width: 1248, height: 832 },
  '3:4': { width: 896, height: 1152 },
  '4:3': { width: 1152, height: 896 },
  '9:16': { width: 768, height: 1344 },
  '16:9': { width: 1344, height: 768 },
};

