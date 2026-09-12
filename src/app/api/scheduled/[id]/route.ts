import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function getScheduledPosts() {
  const docRef = doc(db, 'app_data', 'scheduled_posts');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().list) {
    return docSnap.data().list;
  }
  return [];
}

async function saveScheduledPosts(list: any[]) {
  const docRef = doc(db, 'app_data', 'scheduled_posts');
  await setDoc(docRef, { list }, { merge: true });
}

// DELETE a scheduled post
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const postId = params.id;
    const posts = await getScheduledPosts();
    const filtered = posts.filter((p: any) => p.id !== postId);

    if (posts.length === filtered.length) {
      return NextResponse.json({ error: 'Scheduled post not found' }, { status: 404 });
    }

    await saveScheduledPosts(filtered);
    return NextResponse.json({ success: true, message: 'Scheduled post cancelled' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete scheduled post' }, { status: 500 });
  }
}

// EDIT a scheduled post
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const postId = params.id;
    const body = await request.json();
    const { content, scheduledTime } = body;

    const posts = await getScheduledPosts();
    const index = posts.findIndex((p: any) => p.id === postId);

    if (index === -1) {
      return NextResponse.json({ error: 'Scheduled post not found' }, { status: 404 });
    }

    if (content) posts[index].content = content;
    if (scheduledTime) posts[index].scheduledTime = scheduledTime;

    await saveScheduledPosts(posts);
    return NextResponse.json({ success: true, message: 'Scheduled post updated' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update scheduled post' }, { status: 500 });
  }
}
