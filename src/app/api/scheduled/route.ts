import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { processScheduledPosts } from '@/lib/processScheduled';

export const maxDuration = 60; // Allow Vercel up to 60 seconds for background execution

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'business-1';

    // Auto-process any pending scheduled posts that are now due
    await processScheduledPosts();

    const docRef = doc(db, 'app_data', 'scheduled_posts');
    const docSnap = await getDoc(docRef);

    let scheduledList: any[] = [];
    if (docSnap.exists() && docSnap.data().list) {
      scheduledList = docSnap.data().list;
    }

    // Filter by businessId and status === 'PENDING'
    const pendingPosts = scheduledList.filter((p: any) => 
      (p.businessId === businessId || !p.businessId) && p.status === 'PENDING'
    );

    // Sort by scheduledTime ascending (earliest first)
    pendingPosts.sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

    return NextResponse.json({ success: true, posts: pendingPosts });
  } catch (error: any) {
    console.error("Fetch Scheduled Posts Error:", error);
    return NextResponse.json({ error: 'Failed to fetch scheduled posts', message: error.message }, { status: 500 });
  }
}
