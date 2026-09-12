import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { publishPostToPlatforms, getConfig } from '@/lib/publisher';

export const maxDuration = 60; // Allow Vercel up to 60 seconds for background execution

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessId, content, platforms, mediaUrl, mediaType, scheduledTime, isSchedule } = body;
    console.log("Incoming POST payload:", { platforms, mediaUrl, mediaType, scheduledTime, isSchedule });

    if (!businessId || !content || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const config = await getConfig(businessId);
    if (!config) {
      return NextResponse.json({ error: 'No configuration found for this business' }, { status: 400 });
    }

    const shouldSchedule = isSchedule === true || (isSchedule !== false && Boolean(scheduledTime) && new Date(scheduledTime).getTime() > Date.now() - 60000);

    if (shouldSchedule && scheduledTime) {
      const docRef = doc(db, 'app_data', 'scheduled_posts');
      const docSnap = await getDoc(docRef);
      let scheduledList: any[] = [];
      if (docSnap.exists() && docSnap.data().list) {
        scheduledList = docSnap.data().list;
      }

      const newScheduledPost = {
        id: 'sched-' + Date.now(),
        businessId,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        platforms,
        scheduledTime,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      scheduledList.push(newScheduledPost);
      await setDoc(docRef, { list: scheduledList }, { merge: true });

      return NextResponse.json({
        success: true,
        isScheduled: true,
        scheduledTime,
        message: `Post scheduled successfully for ${new Date(scheduledTime).toLocaleString()}!`
      });
    }

    const results = await publishPostToPlatforms({
      businessId,
      content,
      platforms,
      mediaUrl,
      mediaType
    });

    return NextResponse.json({ success: true, results, message: "Posted via Native Developer APIs!" });

  } catch (error: any) {
    console.error('Internal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message }, { status: 500 });
  }
}
