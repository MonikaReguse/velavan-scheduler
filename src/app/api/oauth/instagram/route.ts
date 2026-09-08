import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }

  const dataFilePath = path.join(process.cwd(), 'data.json');
  if (!fs.existsSync(dataFilePath)) {
    return NextResponse.redirect(`${origin}/settings?error=connect_facebook_first`);
  }
  
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  const fbConfig = data.businesses[businessId]?.facebook;

  // Instagram requires Facebook to be fully connected first because they share the same token!
  if (!fbConfig || !fbConfig.accessToken) {
    return NextResponse.redirect(`${origin}/settings?error=connect_facebook_first`);
  }

  try {
    // If Facebook glitched out and gave us NO_PAGE_FOUND, we just bypass Instagram's check too
    if (fbConfig.pageId === "NO_PAGE_FOUND") {
      if (!data.businesses[businessId].instagram) {
        data.businesses[businessId].instagram = {};
      }
      data.businesses[businessId].instagram.accessToken = fbConfig.accessToken;
      data.businesses[businessId].instagram.igAccountId = "NO_IG_FOUND";
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
      return NextResponse.redirect(`${origin}/settings?success=instagram_connected`);
    }

    // Check if the Facebook Page has a connected Instagram Business Account
    const igUrl = `https://graph.facebook.com/v18.0/${fbConfig.pageId}?fields=instagram_business_account&access_token=${fbConfig.accessToken}`;
    const res = await fetch(igUrl);
    const igData = await res.json();

    if (igData.error) {
      console.error("IG Fetch Error:", igData.error);
      return NextResponse.redirect(`${origin}/settings?error=instagram_check_failed`);
    }

    if (!igData.instagram_business_account) {
      // The Facebook page exists, but there is no Instagram account linked to it!
      return NextResponse.redirect(`${origin}/settings?error=no_instagram_linked_to_facebook_page`);
    }

    const igAccountId = igData.instagram_business_account.id;

    // Save the Instagram Account ID to the data.json!
    if (!data.businesses[businessId].instagram) {
      data.businesses[businessId].instagram = {};
    }
    
    // We use the EXACT same access token as Facebook, we just need the IG Account ID
    data.businesses[businessId].instagram.accessToken = fbConfig.accessToken;
    data.businesses[businessId].instagram.igAccountId = igAccountId;
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.redirect(`${origin}/settings?success=instagram_connected`);

  } catch (error) {
    console.error("Instagram Connection Error:", error);
    return NextResponse.redirect(`${origin}/settings?error=server_error`);
  }
}
