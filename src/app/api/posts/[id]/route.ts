import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

async function readPosts() {
  const docRef = doc(db, 'app_data', 'posts');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data().list || [];
  return [];
}

async function writePosts(data: any[]) {
  const docRef = doc(db, 'app_data', 'posts');
  await setDoc(docRef, { list: data }, { merge: true });
}

async function getConfig() {
  const docRef = doc(db, 'app_data', 'settings');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().businesses) {
    return docSnap.data().businesses['business-1'] || {};
  }
  return {};
}

// DELETE a post from platforms and database
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const postId = params.id;
    const posts = await readPosts();
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const post = posts[postIndex];
    const config = await getConfig();
    const results = [];
    
    // Facebook Delete
    if (post.platformIds?.facebook && config.facebook?.accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${post.platformIds.facebook}?access_token=${config.facebook.accessToken}`, { method: 'DELETE' });
        results.push({ platform: 'facebook', success: res.ok });
      } catch(e) { results.push({ platform: 'facebook', success: false }); }
    }
    
    // YouTube Delete
    if (post.platformIds?.youtube && config.youtube?.accessToken) {
      try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${post.platformIds.youtube}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${config.youtube.accessToken}` }
        });
        results.push({ platform: 'youtube', success: res.ok });
      } catch(e) { results.push({ platform: 'youtube', success: false }); }
    }
    
    // LinkedIn Delete
    if (post.platformIds?.linkedin && config.linkedin?.accessToken) {
      try {
        const res = await fetch(`https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(post.platformIds.linkedin)}`, { 
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${config.linkedin.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });
        results.push({ platform: 'linkedin', success: res.ok });
      } catch(e) { results.push({ platform: 'linkedin', success: false }); }
    }

    // Instagram Delete
    if (post.platformIds?.instagram && config.instagram?.accessToken) {
      try {
        const res = await fetch(`https://graph.facebook.com/v18.0/${post.platformIds.instagram}?access_token=${config.instagram.accessToken}`, { method: 'DELETE' });
        results.push({ platform: 'instagram', success: res.ok });
      } catch(e) { results.push({ platform: 'instagram', success: false }); }
    }

    // Remove from DB
    posts.splice(postIndex, 1);
    await writePosts(posts);
    
    return NextResponse.json({ success: true, message: 'Deleted', platformResults: results });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

// EDIT a post caption
export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const postId = params.id;
    const body = await request.json();
    const newContent = body.content;
    
    const posts = await readPosts();
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Update local DB
    posts[postIndex].content = newContent;
    await writePosts(posts);
    
    return NextResponse.json({ success: true, message: 'Caption edited in local history' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to edit post' }, { status: 500 });
  }
}
