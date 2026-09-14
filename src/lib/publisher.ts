import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function getConfig(businessId: string) {
  const docRef = doc(db, 'app_data', 'settings');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().businesses) {
    return docSnap.data().businesses[businessId] || null;
  }
  return null;
}

export async function publishPostToPlatforms({
  businessId,
  content,
  platforms,
  mediaUrl,
  mediaType
}: {
  businessId: string;
  content: string;
  platforms: string[];
  mediaUrl?: string | null;
  mediaType?: string | null;
}) {
  const config = await getConfig(businessId);
  if (!config) {
    throw new Error('No configuration found for business ' + businessId);
  }

  const results: any[] = [];
  const platformPromises: Promise<any>[] = [];

  // --- FACEBOOK NATIVE POSTING ---
  if (platforms.includes('facebook')) {
    platformPromises.push((async () => {
      const fbConfig = config.facebook;
      if (!fbConfig || !fbConfig.accessToken || !fbConfig.pageId) {
        return { platform: 'facebook', status: 'error', error: 'Facebook is not fully connected. Missing Page Access Token.' };
      }
      try {
        let fbEndpoint = `https://graph.facebook.com/v18.0/${fbConfig.pageId}`;
        const payload: any = {
          access_token: fbConfig.accessToken,
          message: content
        };
        if (mediaUrl) {
          if (mediaType === 'video') {
            fbEndpoint += '/videos';
            payload.file_url = mediaUrl;
          } else {
            fbEndpoint += '/photos';
            payload.url = mediaUrl;
          }
        } else {
          fbEndpoint += '/feed';
        }

        const fbRes = await fetch(fbEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const fbData = await fbRes.json();
        if (fbData.error) return { platform: 'facebook', status: 'error', error: fbData.error.message };
        return { platform: 'facebook', status: 'success', id: fbData.id || fbData.post_id };
      } catch (e: any) {
        return { platform: 'facebook', status: 'error', error: e.message };
      }
    })());
  }

  // --- LINKEDIN NATIVE POSTING ---
  if (platforms.includes('linkedin')) {
    platformPromises.push((async () => {
      const liConfig = config.linkedin;
      if (!liConfig || !liConfig.accessToken || !liConfig.authorUrn) {
        return { platform: 'linkedin', status: 'error', error: 'LinkedIn is not fully connected.' };
      }
      try {
        let specificContent: any = {
          "com.linkedin.ugc.ShareContent": {
            "shareCommentary": { "text": content },
            "shareMediaCategory": "NONE"
          }
        };

        if (mediaUrl) {
          const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${liConfig.accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify({
              registerUploadRequest: {
                recipes: [mediaType === 'video' ? 'urn:li:digitalmediaRecipe:feedshare-video' : 'urn:li:digitalmediaRecipe:feedshare-image'],
                owner: liConfig.authorUrn,
                serviceRelationships: [{ relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" }]
              }
            })
          });
          const registerData = await registerRes.json();
          if (registerData.value) {
            const uploadMechanism = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
            const uploadUrl = uploadMechanism.uploadUrl;
            const assetUrn = registerData.value.asset;

            const mediaRes = await fetch(mediaUrl);
            const mediaBlob = await mediaRes.blob();

            await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${liConfig.accessToken}` },
              body: mediaBlob
            });

            specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = mediaType === 'video' ? "VIDEO" : "IMAGE";
            specificContent["com.linkedin.ugc.ShareContent"].media = [{
              status: "READY",
              description: { text: "Uploaded media" },
              media: assetUrn,
              title: { text: "Media" }
            }];
          }
        }

        const payload = {
          "author": liConfig.authorUrn,
          "lifecycleState": "PUBLISHED",
          "specificContent": specificContent,
          "visibility": { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
        };

        const liPostRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${liConfig.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          },
          body: JSON.stringify(payload)
        });

        const liPostData = await liPostRes.json();
        if (liPostData.message || liPostData.status) return { platform: 'linkedin', status: 'error', error: liPostData.message };
        return { platform: 'linkedin', status: 'success', id: liPostData.id };
      } catch (e: any) {
        return { platform: 'linkedin', status: 'error', error: e.message };
      }
    })());
  }

  // --- INSTAGRAM NATIVE POSTING ---
  if (platforms.includes('instagram')) {
    platformPromises.push((async () => {
      const igConfig = config.instagram;
      if (!igConfig || !igConfig.accessToken || !igConfig.igAccountId) {
        return { platform: 'instagram', status: 'error', error: 'Instagram is not fully connected.' };
      }
      if (!mediaUrl) {
        return { platform: 'instagram', status: 'error', error: 'Instagram requires an image or video to post.' };
      }
      
      try {
        const containerPayload: any = {
          access_token: igConfig.accessToken,
          caption: content
        };
        if (mediaType === 'video') {
          containerPayload.media_type = 'REELS';
          containerPayload.video_url = mediaUrl;
        } else {
          containerPayload.media_type = 'IMAGE';
          containerPayload.image_url = mediaUrl;
        }

        const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igConfig.igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerPayload)
        });
        const containerData = await containerRes.json();

        if (containerData.error) {
          return { platform: 'instagram', status: 'error', error: containerData.error.message };
        }

        const creationId = containerData.id;
        let isReady = false;

        // Poll container status until FINISHED (up to 15s for both image & video)
        const maxPolls = mediaType === 'video' ? 12 : 8;
        const delayMs = 1500;

        for (let i = 0; i < maxPolls; i++) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          const statusRes = await fetch(`https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${igConfig.accessToken}`);
          const statusData = await statusRes.json();
          if (statusData.status_code === 'FINISHED') {
            isReady = true;
            break;
          } else if (statusData.status_code === 'ERROR') {
            return { platform: 'instagram', status: 'error', error: 'Instagram failed to process the media container.' };
          }
        }

        if (!isReady) {
          return { platform: 'instagram', status: 'error', error: 'Instagram took too long to process the media.' };
        }

        const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igConfig.igAccountId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: igConfig.accessToken
          })
        });
        const publishData = await publishRes.json();

        if (publishData.error) {
          return { platform: 'instagram', status: 'error', error: publishData.error.message };
        }
        return { platform: 'instagram', status: 'success', id: publishData.id };
      } catch (e: any) {
        return { platform: 'instagram', status: 'error', error: e.message };
      }
    })());
  }

  // --- PINTEREST NATIVE POSTING ---
  if (platforms.includes('pinterest')) {
    platformPromises.push((async () => {
      const pinConfig = config.pinterest;
      if (!pinConfig || !pinConfig.accessToken) {
        return { platform: 'pinterest', status: 'error', error: 'Pinterest is not fully connected.' };
      }
      if (!mediaUrl) {
        return { platform: 'pinterest', status: 'error', error: 'Pinterest requires an image or video to post.' };
      }
      try {
        const boardsRes = await fetch('https://api.pinterest.com/v5/boards', {
          headers: { 'Authorization': `Bearer ${pinConfig.accessToken}` }
        });
        const boardsData = await boardsRes.json();

        if (boardsData.items && boardsData.items.length > 0) {
          const boardId = boardsData.items[0].id;
          const pinPayload = {
            board_id: boardId,
            title: content.substring(0, 50),
            description: content,
            media_source: { source_type: "image_url", url: mediaUrl }
          };
          const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${pinConfig.accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pinPayload)
          });
          const pinData = await pinRes.json();
          if (pinData.code && pinData.message) {
            return { platform: 'pinterest', status: 'error', error: pinData.message };
          }
          return { platform: 'pinterest', status: 'success', id: pinData.id };
        } else {
          return { platform: 'pinterest', status: 'error', error: 'No Pinterest boards found. You must create a board first.' };
        }
      } catch (e: any) {
        return { platform: 'pinterest', status: 'error', error: e.message };
      }
    })());
  }

  // --- YOUTUBE NATIVE POSTING ---
  if (platforms.includes('youtube')) {
    platformPromises.push((async () => {
      const ytConfig = config.youtube;
      if (!ytConfig || !ytConfig.accessToken) {
        return { platform: 'youtube', status: 'error', error: 'YouTube is not fully connected.' };
      }
      if (!mediaUrl) {
        return { platform: 'youtube', status: 'error', error: 'YouTube requires a video file to post.' };
      }
      try {
        const videoRes = await fetch(mediaUrl);
        const videoBuffer = await videoRes.arrayBuffer();
        const snippet = {
          snippet: { title: content.substring(0, 100) || "Video Post", description: content, categoryId: "22" },
          status: { privacyStatus: "public", selfDeclaredMadeForKids: false }
        };
        const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ytConfig.accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': videoBuffer.byteLength.toString()
          },
          body: JSON.stringify(snippet)
        });
        if (!initRes.ok) {
          const errorData = await initRes.json();
          throw new Error(errorData.error?.message || 'Failed to initialize YouTube upload');
        }
        const uploadUrl = initRes.headers.get('Location');
        if (uploadUrl) {
          const uploadReq = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Length': videoBuffer.byteLength.toString() },
            body: Buffer.from(videoBuffer)
          });
          const uploadData = await uploadReq.json();
          if (uploadData.error) {
            return { platform: 'youtube', status: 'error', error: uploadData.error.message };
          }
          return { platform: 'youtube', status: 'success', id: uploadData.id };
        } else {
          return { platform: 'youtube', status: 'error', error: 'Did not receive upload URL from YouTube' };
        }
      } catch (e: any) {
        return { platform: 'youtube', status: 'error', error: e.message };
      }
    })());
  }

  // Wait for all platforms in parallel
  const resolvedResults = await Promise.all(platformPromises);
  results.push(...resolvedResults);

  // --- SAVE POST HISTORY TO FIREBASE ---
  try {
    const successResults = results.filter((r: any) => r.status === 'success');
    if (successResults.length > 0) {
      const platformIds: any = {};
      successResults.forEach((r: any) => {
        platformIds[r.platform] = r.id;
      });
      
      const newPost = {
        id: 'post-' + Date.now(),
        businessId,
        content,
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        platforms: successResults.map((r: any) => r.platform),
        platformIds,
        createdAt: new Date().toISOString()
      };
      
      const docRef = doc(db, 'app_data', 'posts');
      const docSnap = await getDoc(docRef);
      let posts = [];
      if (docSnap.exists() && docSnap.data().list) {
        posts = docSnap.data().list;
      }
      posts.push(newPost);
      await setDoc(docRef, { list: posts }, { merge: true });
    }
  } catch (saveError) {
    console.error("Failed to save post history to Firebase:", saveError);
  }

  return results;
}
