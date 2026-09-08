import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function readPosts() {
  const docRef = doc(db, 'app_data', 'posts');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().list || [];
  } else {
    await setDoc(docRef, { list: [] });
    return [];
  }
}

export async function writePosts(data: any[]) {
  const docRef = doc(db, 'app_data', 'posts');
  await setDoc(docRef, { list: data }, { merge: true });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId') || 'business-1';
    
    const posts = await readPosts();
    // Sort by createdAt descending (newest first)
    const sortedPosts = posts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json({ success: true, posts: sortedPosts });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch posts', message: error.message }, { status: 500 });
  }
}
