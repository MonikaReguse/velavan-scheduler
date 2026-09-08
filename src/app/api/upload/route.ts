import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Note: Cloudinary expects raw bytes or a local file path.
// We will read the file as an arrayBuffer and pass it as a base64 string or stream.

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Cloudinary credentials missing" }, { status: 500 });
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const resourceType = file.type.startsWith('video') ? 'video' : 'image';

    // Use Cloudinary stream upload which handles large files/videos properly via chunking
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: resourceType, chunk_size: 6000000 }, // 6MB chunks to avoid 413 Payload Too Large
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json(uploadResult);
  } catch (error: any) {
    console.error("Backend Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
