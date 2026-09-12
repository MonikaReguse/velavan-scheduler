import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { publishPostToPlatforms } from '@/lib/publisher';

export async function processScheduledPosts() {
  try {
    const docRef = doc(db, 'app_data', 'scheduled_posts');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { processedCount: 0 };
    }

    const scheduledList: any[] = docSnap.data().list || [];
    const now = Date.now();
    let processedCount = 0;

    const updatedList = [];

    for (const post of scheduledList) {
      const scheduledTimeMs = new Date(post.scheduledTime).getTime();
      
      if (post.status === 'PENDING' && scheduledTimeMs <= now) {
        console.log(`[Scheduler] Processing scheduled post ${post.id}...`);
        try {
          const results = await publishPostToPlatforms({
            businessId: post.businessId || 'business-1',
            content: post.content,
            platforms: post.platforms,
            mediaUrl: post.mediaUrl,
            mediaType: post.mediaType
          });
          console.log(`[Scheduler] Published post ${post.id} with results:`, results);
          processedCount++;
          updatedList.push({
            ...post,
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error(`[Scheduler] Error publishing scheduled post ${post.id}:`, err);
          updatedList.push({
            ...post,
            status: 'FAILED',
            error: String(err)
          });
        }
      } else {
        updatedList.push(post);
      }
    }

    if (processedCount > 0) {
      await setDoc(docRef, { list: updatedList }, { merge: true });
    }

    return { processedCount };
  } catch (error) {
    console.error("[Scheduler] Error processing scheduled posts:", error);
    return { error: String(error) };
  }
}
