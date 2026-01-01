/**
 * File Upload API Route
 * Handle file attachments for messages
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/communication/upload
 * Upload file attachment
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for general files, 50MB for videos)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // In production, upload to S3 or similar storage
    // const s3Key = `attachments/${Date.now()}-${file.name}`;
    // await s3Client.upload({
    //   Bucket: process.env.S3_BUCKET,
    //   Key: s3Key,
    //   Body: Buffer.from(await file.arrayBuffer()),
    //   ContentType: file.type,
    // });

    // For now, return mock response
    const attachment = {
      id: `attach_${Date.now()}`,
      name: file.name,
      type: getAttachmentType(file.type),
      url: `/uploads/${Date.now()}-${file.name}`, // Mock URL
      thumbnailUrl: file.type.startsWith('image/') ? `/uploads/thumb-${Date.now()}-${file.name}` : undefined,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

function getAttachmentType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'file' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet')) {
    return 'document';
  }
  return 'file';
}
