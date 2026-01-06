import { constructMetadata } from '@/lib/metadata';
import { FaceSwapForm } from '@/components/ai-tools/face-swap-form';
import type { Metadata } from 'next';
import type { Locale } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata | undefined> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return constructMetadata({
    title: 'AI Face Swap - ' + t('title'),
    description: 'Seamlessly swap faces between two photos with AI-powered precision.',
    locale,
    pathname: '/ai-tools/face-swap',
  });
}

export default async function FaceSwapPage() {
  return <FaceSwapForm />;
}

