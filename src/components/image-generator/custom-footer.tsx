'use client';

import { MailIcon } from 'lucide-react';
import Link from 'next/link';

const aiImageTools = [
  { title: 'AI Image to Image', href: '/' },
  { title: 'AI Image Generator', href: '/ai-tools/image-generator' },
  { title: 'AI Image Editor', href: '/ai-tools/image-editor' },
  { title: 'Old Photo Restoration', href: '/ai-tools/photo-restoration' },
  { title: 'AI Image Upscaler', href: '/ai-tools/image-upscaler' },
  { title: 'AI Background Remover', href: '/ai-tools/background-remover' },
  { title: 'AI Background Changer', href: '/ai-tools/background-changer' },
  { title: 'AI Face Swap', href: '/ai-tools/face-swap' },
  { title: 'AI Watermark Remover', href: '/ai-tools/watermark-remover' },
  { title: 'AI Image Enhancer', href: '/ai-tools/image-enhancer' },
];

const photoEffects = [
  { title: 'Ghibli AI Generator', href: '/ai-tools/ghibli-generator' },
  { title: 'AI Cartoon Generator', href: '/ai-tools/cartoon-generator' },
];

const aiVideoTools = [
  { title: 'Text to Video AI', href: '/ai-tools/text-to-video' },
  { title: 'Image to Video AI', href: '/ai-tools/image-to-video' },
];

const companyLinks = [
  { title: 'Privacy Policy', href: '/privacy' },
  { title: 'Terms of Service', href: '/terms' },
  { title: 'Refund Policy', href: '/refund' },
];

export function CustomFooter() {
  return (
    <footer className="bg-muted/30 dark:bg-muted/10 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-full bg-foreground/10 flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="21.17" y1="8" x2="12" y2="8" />
                  <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                  <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                </svg>
              </div>
              <span className="font-semibold text-foreground">Image To Image AI</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Image to Image AI Generator is a free
              online photo editor that offers powerful
              features allowing you to edit, reshape,
              and restyle images using text prompts.
            </p>
            <a
              href="mailto:hi@imgtoimg.ai"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MailIcon className="size-4" />
              hi@imgtoimg.ai
            </a>
          </div>

          {/* AI Image Tools */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">AI Image Tools</h3>
            <ul className="space-y-2.5">
              {aiImageTools.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Photo Effects */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">Photo Effects</h3>
            <ul className="space-y-2.5">
              {photoEffects.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Video Tools */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">AI Video Tools</h3>
            <ul className="space-y-2.5">
              {aiVideoTools.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-sm text-foreground mb-4">Company</h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Image To Image AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

