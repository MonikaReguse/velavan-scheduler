import { NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/processScheduled';

export const maxDuration = 60; // Allow up to 60 seconds for background execution

export async function GET() {
  try {
    const result = await processScheduledPosts();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), result });
  } catch (error: any) {
    console.error("Cron Processing Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
