'use client';

import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ClockIcon,
  DiamondIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CustomFooter } from './custom-footer';
import { RelatedAITools } from './related-ai-tools';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

interface GeneratedOutput {
  taskId: string;
  imageUrl: string;
}

interface RecentTask {
  id: string;
  status: string;
  prompt: string;
  createdAt: string;
  outputs?: { storageKey: string; imageUrl: string }[];
}

const aspectRatios = [
  { value: '1:1', width: 1, height: 1 },
  { value: '2:3', width: 2, height: 3 },
  { value: '3:2', width: 3, height: 2 },
  { value: '3:4', width: 3, height: 4 },
  { value: '4:3', width: 4, height: 3 },
  { value: '9:16', width: 9, height: 16 },
  { value: '16:9', width: 16, height: 9 },
];

const outputOptions = [
  { value: 1, premium: false },
  { value: 2, premium: false },
  { value: 4, premium: true },
];

export function ImageGeneratorForm() {
  const currentUser = useCurrentUser();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('max');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numOutputs, setNumOutputs] = useState(1);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutputs, setGeneratedOutputs] = useState<GeneratedOutput[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store ref for cleanup on unmount only
  const uploadedImagesRef = useRef<UploadedImage[]>([]);
  uploadedImagesRef.current = uploadedImages;

  // Cleanup preview URLs on unmount only
  useEffect(() => {
    return () => {
      uploadedImagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // Fetch recent tasks on mount
  useEffect(() => {
    fetchRecentTasks();
  }, []);

  const fetchRecentTasks = async () => {
    try {
      const response = await fetch('/api/img2img/task');
      if (response.ok) {
        const data = (await response.json()) as { tasks?: RecentTask[] };
        setRecentTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent tasks:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - uploadedImages.length).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setUploadedImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    // Check if user is logged in
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }

    // Validation
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedOutputs([]);

    try {
      // Step 1: Create task and upload images
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('model', model);
      formData.append('aspectRatio', aspectRatio);
      formData.append('numOutputs', numOutputs.toString());
      
      for (const img of uploadedImages) {
        formData.append('images', img.file);
      }

      const createResponse = await fetch('/api/img2img/task', {
        method: 'POST',
        body: formData,
      });

      // Check for unauthorized error
      if (createResponse.status === 401) {
        setShowLoginModal(true);
        setIsGenerating(false);
        return;
      }

      if (!createResponse.ok) {
        const error:any = await createResponse.json();
        throw new Error(error.error || 'Failed to create task');
      }

      const { taskId }:any = await createResponse.json();
      toast.info('Task created, generating images...');

      // Step 2: Execute generation
      const generateResponse = await fetch('/api/img2img', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          prompt,
          model,
          aspectRatio,
          numOutputs,
        }),
      });

      // Check for unauthorized error
      if (generateResponse.status === 401) {
        setShowLoginModal(true);
        setIsGenerating(false);
        return;
      }

      if (!generateResponse.ok) {
        const error: any = await generateResponse.json();
        throw new Error(error.error || 'Failed to generate images');
      }

      const result: any = await generateResponse.json();
      
      // Set generated outputs - API now returns public URLs directly
      const outputs = result.outputs.map((imageUrl: string) => ({
        taskId,
        imageUrl,
      }));
      setGeneratedOutputs(outputs);
      
      toast.success(`Generated ${outputs.length} image(s)! Credits used: ${result.creditsUsed}`);

      // Refresh recent tasks
      await fetchRecentTasks();
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="hidden">
            <DialogTitle />
          </DialogHeader>
          <LoginForm className="border-none" />
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="text-center pt-12 pb-8 px-4">
        <h1 className="text-4xl md:text-5xl font-serif font-normal tracking-tight mb-3">
          Image to Image AI Generator
        </h1>
        <p className="text-muted-foreground text-base">
          Harness AI to morph, stylize, and recreate any image effortlessly
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">
          {/* Left column - Form */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Image Upload</h2>
              <p className="text-sm text-muted-foreground">
                Upload an image to use as a reference, maximum 5 images allowed.
              </p>

              {/* Show uploaded images grid if any */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-card"
                    >
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 dark:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black"
                      >
                        <XIcon className="size-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-2 py-1 truncate">
                        {img.file.name}
                      </div>
                    </div>
                  ))}

                  {/* Add more button if less than 5 images */}
                  {uploadedImages.length < 5 && (
                    <button
                      type="button"
                      onClick={handleUploadClick}
                      className="aspect-square rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground hover:text-foreground transition-colors"
                    >
                      <UploadIcon className="size-5" />
                      <span className="text-xs">Add more</span>
                    </button>
                  )}
                </div>
              )}

              {/* Upload area (show when no images or as alternative) */}
              {uploadedImages.length === 0 && (
                <div
                  onClick={handleUploadClick}
                  className="border border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-muted-foreground transition-colors min-h-[160px]"
                >
                  <UploadIcon className="size-6 text-muted-foreground" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadClick();
                    }}
                  >
                    Upload Image
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    We accept .jpeg, .jpg, .png, .webp formats up to 24MB.
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpeg,.jpg,.png,.webp"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Prompt</h2>
              <p className="text-sm text-muted-foreground">
                Describe what you want to change in the image
              </p>
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 1000))}
                  placeholder="Example: Change the background to a blue sky."
                  className="min-h-[100px] bg-transparent resize-none"
                />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {prompt.length}/1000
                </span>
              </div>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Model</h2>
              <p className="text-sm text-muted-foreground">
                Choose the AI model for image generation
              </p>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-full h-auto py-3">
                  <SelectValue>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">
                        {model === 'max' ? 'Max' : model === 'turbo' ? 'Turbo' : 'Standard'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {model === 'max'
                          ? '4K output • Faster processing • Recommended'
                          : model === 'turbo'
                            ? 'Quick results • Lower resolution'
                            : 'Balanced quality and speed'}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="max">
                    <div className="flex flex-col">
                      <span className="font-medium">Max</span>
                      <span className="text-xs text-muted-foreground">
                        4K output • Faster processing • Recommended
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="turbo">
                    <div className="flex flex-col">
                      <span className="font-medium">Turbo</span>
                      <span className="text-xs text-muted-foreground">
                        Quick results • Lower resolution
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="standard">
                    <div className="flex flex-col">
                      <span className="font-medium">Standard</span>
                      <span className="text-xs text-muted-foreground">
                        Balanced quality and speed
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <h2 className="text-base font-semibold">Aspect Ratio</h2>
              <p className="text-sm text-muted-foreground">
                Choose the aspect ratio you want to use
              </p>
              <div className="flex flex-wrap gap-2">
                {aspectRatios.map((ratio) => {
                  const isSelected = aspectRatio === ratio.value;
                  // Calculate icon dimensions (max 24px height)
                  const maxDim = 20;
                  const scale = maxDim / Math.max(ratio.width, ratio.height);
                  const w = Math.round(ratio.width * scale);
                  const h = Math.round(ratio.height * scale);

                  return (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setAspectRatio(ratio.value)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-lg border transition-colors min-w-[56px]',
                        isSelected
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div
                        className={cn(
                          'border rounded-sm',
                          isSelected ? 'border-foreground' : 'border-muted-foreground'
                        )}
                        style={{ width: w, height: h }}
                      />
                      <span className="text-xs">{ratio.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Number of Outputs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Number of Outputs</h2>
                <DiamondIcon className="size-4 text-purple-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Choose the number of outputs you want to generate
              </p>
              <div className="flex gap-2">
                {outputOptions.map((option) => {
                  const isSelected = numOutputs === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNumOutputs(option.value)}
                      className={cn(
                        'flex-1 py-3 rounded-lg border transition-colors font-medium',
                        isSelected
                          ? 'bg-muted border-border text-foreground'
                          : 'bg-transparent border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      )}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || uploadedImages.length === 0}
              className="w-full py-6 text-base font-medium rounded-lg"
            >
              <span className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Images
                    <span className="flex items-center gap-1 opacity-60">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      1.5
                    </span>
                  </>
                )}
              </span>
            </Button>

            {/* Generated Outputs */}
            {generatedOutputs.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-base font-semibold">Generated Images</h2>
                <div className="grid grid-cols-2 gap-3">
                  {generatedOutputs.map((output, index) => (
                    <div
                      key={output.imageUrl}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border bg-card"
                    >
                      <img
                        src={output.imageUrl}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Recent Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent Tasks</h2>
              <button 
                onClick={fetchRecentTasks}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View All
                <ClockIcon className="size-4" />
              </button>
            </div>
            {recentTasks.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        {task.outputs && task.outputs.length > 0 ? (
                          <img
                            src={task.outputs[0].imageUrl}
                            alt="Output"
                            className="size-12 rounded object-cover bg-muted"
                          />
                        ) : (
                          <div className="size-12 rounded bg-muted flex items-center justify-center">
                            <ClockIcon className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.prompt}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'text-xs px-1.5 py-0.5 rounded',
                                task.status === 'completed'
                                  ? 'bg-green-500/10 text-green-600'
                                  : task.status === 'failed'
                                    ? 'bg-red-500/10 text-red-600'
                                    : 'bg-yellow-500/10 text-yellow-600'
                              )}
                            >
                              {task.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg min-h-[400px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <ClockIcon className="size-8" />
                <p className="text-sm">Your recent creations will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related AI Tools Section */}
      <RelatedAITools />

      {/* What is AI Image to Image Generator Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight text-foreground mb-2">
            What is AI Image to Image Generator?
          </h2>
          <div className="w-12 h-0.5 bg-primary mx-auto mb-8" />
          
          <div className="space-y-6 text-muted-foreground text-sm leading-relaxed">
            <p>
              Image to Image AI is a powerful transformation tool that lets you convert existing images into
              new variations using advanced artificial intelligence. Unlike text-to-image generators that
              create images from scratch, our technology preserves the structure and composition of your
              original image while applying the changes you describe.
            </p>
            <p>
              Our system utilizes state-of-the-art neural networks that understand both your source image
              and your instructions, intelligently applying transformations while maintaining the integrity of
              key elements. This provides exceptional control over the final result with the perfect balance
              between transformation and preservation.
            </p>
            <p>
              Whether you're a designer seeking to visualize concepts, a marketer creating multiple
              variations of campaign assets, or a creative enthusiast experimenting with artistic styles, Image
              to Image AI delivers professional-quality results with remarkable efficiency.
            </p>
          </div>
        </div>
      </section>

      {/* AI Photo Generator Steps Section */}
      <section className="py-20 px-4 bg-muted/30 dark:bg-muted/10 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif italic font-normal tracking-tight text-foreground mb-3">
              AI Photo Generator from photo: 4 Simple Steps
            </h2>
            <p className="text-muted-foreground text-sm">
              Creating stunning image variations is quick and intuitive:
            </p>
          </div>

          {/* Steps Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  1
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Step 1: Upload Your Photo
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select an image from your device to use as the starting point. For best results, use clear images with good lighting and
                  resolution that match your desired output aspect ratio.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  2
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Step 2: Describe Your Changes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Write a prompt describing how you want to transform the image. Be specific about style, colors, modifications, or artistic
                  effects you want to apply.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  3
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Step 3: Adjust Settings
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fine-tune transformation parameters like aspect ratio, output count, and transformation strength to control how closely
                  the result resembles your original image.
                </p>
              </div>

              {/* Step 4 */}
              <div className="relative pl-10">
                <div className="absolute left-0 top-0 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  4
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  Step 4: Generate and Download
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Click generate and watch as AI transforms your image. Browse the results, select your favorites, and download high-
                  quality versions ready for use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-serif italic font-normal tracking-tight text-foreground mb-4">
            Start Transforming Your Images Today
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Upload your first image and experience the power of AI transformation. No design skills
            required—just your images and ideas.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
            </svg>
            Transform an Image Now
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30 dark:bg-muted/10 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif italic font-normal tracking-tight text-foreground mb-3">
              Frequently Asked Questions about Image to Image AI
            </h2>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Learn more about our Image to Image AI transformation capabilities and how to get the best
              results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* FAQ 1 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  How does Image to Image differ from Text to Image generation?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Image to Image uses your existing image as a starting point, maintaining its
                core structure while applying transformations. Text to Image creates
                completely new images from text descriptions with no visual reference
                point.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  What types of images work best with the transformation?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The best results come from clear, well-lit images with defined subjects. The
                system works with portraits, landscapes, product photos, and more. For
                optimal results, use images that match your desired output aspect ratio.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  How much control do I have over the transformation process?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can control transformation strength to determine how closely the
                output resembles your original image, specify detailed prompts to guide the
                AI, and generate multiple variations to choose from.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  How long does the transformation process take?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Most transformations complete in seconds, with more complex changes
                taking up to a minute. You can generate multiple outputs simultaneously to
                explore different options efficiently.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  What image formats and sizes are supported?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We accept JPEG, PNG and WEBP formats up to 24MB and 4096 x 4096
                pixels. Output images are provided in high-quality formats optimized for
                your intended use.
              </p>
            </div>

            {/* FAQ 6 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Can I use the transformed images commercially?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Yes, paid subscription plans include commercial licensing rights, allowing
                you to use transformed images for business purposes including marketing,
                advertising, and product displays.
              </p>
            </div>

            {/* FAQ 7 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  What if I'm not satisfied with the transformation results?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We recommend adjusting your prompt to be more specific, trying different
                transformation strength settings, or generating multiple variations. Our
                support team is also available to help optimize your results.
              </p>
            </div>

            {/* FAQ 8 */}
            <div className="p-5 rounded-xl border border-border bg-card/50">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Is there a limit to how many images I can transform?
                </h3>
                <ChevronDownIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Free users receive a monthly allocation of transformations. Paid
                subscription plans offer higher monthly limits with options to purchase
                additional credits as needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Footer */}
      <CustomFooter />
    </div>
  );
}
