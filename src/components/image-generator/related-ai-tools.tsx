'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface AITool {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

const aiTools: AITool[] = [
  {
    id: 'face-swap',
    title: 'AI Face Swap',
    description: 'Seamlessly swap faces between two photos with AI-powered technology.',
    image: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=400&h=300&fit=crop',
    href: '/ai-tools/face-swap',
  },
  {
    id: 'background-changer',
    title: 'AI Background Changer',
    description: 'Transform any photo with intelligent background replacement.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=300&fit=crop',
    href: '/tools/background-changer',
  },
  {
    id: 'image-editor',
    title: 'AI Image Editor',
    description: 'Edit your photo with AI-powered tools. Transform, enhance, and create.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop',
    href: '/tools/image-editor',
  },
  {
    id: 'background-remover',
    title: 'AI Background Remover',
    description: 'Remove backgrounds from images instantly with AI precision.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop',
    href: '/tools/background-remover',
  },
  {
    id: 'image-upscaler',
    title: 'AI Image Upscaler',
    description: 'Enhance image resolution and quality with advanced AI algorithms.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    href: '/tools/image-upscaler',
  },
  {
    id: 'photo-colorizer',
    title: 'AI Photo Colorizer',
    description: 'Bring black and white photos to life with AI colorization.',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=300&fit=crop',
    href: '/tools/photo-colorizer',
  },
  {
    id: 'style-transfer',
    title: 'AI Style Transfer',
    description: 'Apply artistic styles to your photos with neural style transfer.',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop',
    href: '/tools/style-transfer',
  },
  {
    id: 'object-remover',
    title: 'AI Object Remover',
    description: 'Remove unwanted objects from photos seamlessly with AI.',
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
    href: '/tools/object-remover',
  },
];

export function RelatedAITools() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <section className="bg-muted/30 dark:bg-muted/20 py-16 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif italic font-normal tracking-tight text-foreground mb-3">
            Related AI Tools
          </h2>
          <p className="text-muted-foreground text-base">
            Explore more AI-powered tools to enhance your creative workflow
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {aiTools.map((tool) => (
                <CarouselItem
                  key={tool.id}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
                >
                  <Link
                    href={tool.href}
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-xl mb-3 bg-card">
                      <img
                        src={tool.image}
                        alt={tool.title}
                        className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <h3 className="text-foreground font-semibold text-base mb-1.5 group-hover:text-muted-foreground transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {tool.description}
                    </p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Custom Navigation Buttons */}
            <button
              onClick={scrollPrev}
              className="absolute left-2 top-[22%] z-10 size-9 rounded-full bg-background/80 dark:bg-card/80 hover:bg-background dark:hover:bg-card flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 border border-border"
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className="size-5 text-foreground" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-2 top-[22%] z-10 size-9 rounded-full bg-background/80 dark:bg-card/80 hover:bg-background dark:hover:bg-card flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-200 border border-border"
              aria-label="Next slide"
            >
              <ChevronRightIcon className="size-5 text-foreground" />
            </button>
          </Carousel>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(aiTools.length / 4) }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index * 4)}
                className={cn(
                  'size-2 rounded-full transition-all duration-200',
                  current >= index * 4 && current < (index + 1) * 4
                    ? 'bg-foreground'
                    : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                )}
                aria-label={`Go to slide group ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
