'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { UploadIcon, ChevronLeftIcon, ChevronRightIcon, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { RelatedAITools } from '@/components/image-generator/related-ai-tools';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
}

// Sample showcase images for the preview carousel
const showcaseImages = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=600&h=400&fit=crop',
    alt: 'Face swap example 1',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1518799175676-a0fed7996acb?w=600&h=400&fit=crop',
    alt: 'Face swap example 2',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    alt: 'Face swap example 3',
  },
];

export function FaceSwapForm() {
  const [sourceFace, setSourceFace] = useState<UploadedImage | null>(null);
  const [targetPhoto, setTargetPhoto] = useState<UploadedImage | null>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (sourceFace) URL.revokeObjectURL(sourceFace.preview);
      if (targetPhoto) URL.revokeObjectURL(targetPhoto.preview);
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleSourceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (sourceFace) URL.revokeObjectURL(sourceFace.preview);
      setSourceFace({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    if (sourceInputRef.current) sourceInputRef.current.value = '';
  };

  const handleTargetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (targetPhoto) URL.revokeObjectURL(targetPhoto.preview);
      setTargetPhoto({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    if (targetInputRef.current) targetInputRef.current.value = '';
  };

  const handleSwapFaces = () => {
    console.log('Swapping faces:', {
      sourceFace: sourceFace?.file,
      targetPhoto: targetPhoto?.file,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Breadcrumb */}
      <nav className="pt-6 pb-4 px-4">
        <div className="max-w-6xl mx-auto">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="size-4" />
            <li>
              <Link href="/ai-tools" className="hover:text-foreground transition-colors">
                AI Image Tools
              </Link>
            </li>
            <ChevronRight className="size-4" />
            <li className="text-foreground font-medium">Face Swap</li>
          </ol>
        </div>
      </nav>

      {/* Header */}
      <div className="text-center pt-8 pb-10 px-4">
        <h1 className="text-4xl md:text-5xl font-serif italic font-normal tracking-tight mb-4">
          AI Face Swap
        </h1>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
          Seamlessly swap faces between two photos with AI-powered precision. Upload
          your images and get professional-quality face swapping results in seconds.
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-start">
          {/* Left side - Upload forms */}
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Source Face Upload */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Source Face</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload the photo containing the face you want to use.
                  </p>
                </div>

                <div
                  onClick={() => sourceInputRef.current?.click()}
                  className={cn(
                    'border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-muted-foreground transition-colors min-h-[280px]',
                    sourceFace && 'border-solid'
                  )}
                >
                  {sourceFace ? (
                    <div className="relative w-full h-full">
                      <img
                        src={sourceFace.preview}
                        alt="Source face"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-2 truncate text-center">
                        {sourceFace.file.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="size-12 rounded-full border border-border flex items-center justify-center">
                        <UploadIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-foreground font-medium mb-1">Choose Image</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          We accept .jpeg, .jpg, .png, .webp formats up to 24MB.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <input
                  ref={sourceInputRef}
                  type="file"
                  accept=".jpeg,.jpg,.png,.webp"
                  className="hidden"
                  onChange={handleSourceUpload}
                />
              </div>

              {/* Target Photo Upload */}
              <div className="space-y-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Target Photo</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload the photo where you want to place the new face.
                  </p>
                </div>

                <div
                  onClick={() => targetInputRef.current?.click()}
                  className={cn(
                    'border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-muted-foreground transition-colors min-h-[280px]',
                    targetPhoto && 'border-solid'
                  )}
                >
                  {targetPhoto ? (
                    <div className="relative w-full h-full">
                      <img
                        src={targetPhoto.preview}
                        alt="Target photo"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-2 truncate text-center">
                        {targetPhoto.file.name}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="size-12 rounded-full border border-border flex items-center justify-center">
                        <UploadIcon className="size-5 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="text-foreground font-medium mb-1">Choose Image</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          We accept .jpeg, .jpg, .png, .webp formats up to 24MB.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <input
                  ref={targetInputRef}
                  type="file"
                  accept=".jpeg,.jpg,.png,.webp"
                  className="hidden"
                  onChange={handleTargetUpload}
                />
              </div>
            </div>

            {/* Swap Faces Button */}
            <Button
              onClick={handleSwapFaces}
              className="w-full py-6 text-base font-medium rounded-lg"
            >
              <span className="flex items-center gap-2">
                Swap Faces
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
                  1
                </span>
              </span>
            </Button>
          </div>

          {/* Right side - Preview Carousel */}
          <div className="relative">
            <Carousel
              setApi={setApi}
              opts={{
                align: 'center',
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {showcaseImages.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="overflow-hidden rounded-xl bg-card">
                      <img
                        src={item.image}
                        alt={item.alt}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {/* Navigation Buttons */}
              <button
                onClick={scrollPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-background/80 dark:bg-card/80 hover:bg-background dark:hover:bg-card flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 border border-border"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-5 text-foreground" />
              </button>
              <button
                onClick={scrollNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-background/80 dark:bg-card/80 hover:bg-background dark:hover:bg-card flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 border border-border"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-5 text-foreground" />
              </button>
            </Carousel>

            {/* Pagination Dot */}
            <div className="flex justify-center gap-2 mt-4">
              {showcaseImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    'size-2 rounded-full transition-all duration-200',
                    current === index
                      ? 'bg-foreground'
                      : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related AI Tools Section */}
      <RelatedAITools />
    </div>
  );
}
