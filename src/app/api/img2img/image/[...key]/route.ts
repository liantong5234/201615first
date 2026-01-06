import { getFile } from '@/storage';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Image proxy API for private R2 storage access
 * 
 * This endpoint retrieves images from R2 storage and serves them directly.
 * Since R2 bucket is private, this acts as a proxy to serve images securely.
 * 
 * Usage: GET /api/img2img/image/image-tasks/outputs/taskId/uuid.jpg
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const storageKey = keyParts.join('/');

    console.log(`[image-proxy] Fetching image [key=${storageKey}]`);

    if (!storageKey) {
      return NextResponse.json(
        { error: 'Missing storage key' },
        { status: 400 }
      );
    }

    // Validate that the key is within allowed paths
    if (!storageKey.startsWith('image-tasks/')) {
      return NextResponse.json(
        { error: 'Invalid storage path' },
        { status: 403 }
      );
    }

    // Get file from R2 storage
    const file = await getFile(storageKey);

    // Return the image with appropriate headers
    return new NextResponse(file.data, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[image-proxy] Error:', error);

    if (error instanceof Error && (error.message.includes('not found') || error.message.includes('File not found'))) {
      console.error(`[image-proxy] File not found [key=${(await params).key.join('/')}]`);
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve image' },
      { status: 500 }
    );
  }
}

