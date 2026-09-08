import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000).toString();
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json({ error: 'Missing Cloudinary config' }, { status: 500 });
    }

    const stringToSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sign' }, { status: 500 });
  }
}
