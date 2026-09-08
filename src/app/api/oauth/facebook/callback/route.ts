import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const businessId = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/settings?error=${error}`);
  }

  if (!code || !businessId) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const dataFilePath = path.join(process.cwd(), 'data.json');
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  const clientId = data.businesses[businessId]?.facebook?.clientId;
  const clientSecret = data.businesses[businessId]?.facebook?.clientSecret;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/settings?error=missing_credentials`);
  }

  const redirectUri = `http://localhost:3000/api/oauth/facebook/callback`;

  try {
    // 1. Exchange code for short-lived User Access Token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/settings?error=token_failed`);
    }

    let userAccessToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived User Access Token
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${userAccessToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();
    
    if (longLivedData.access_token) {
      userAccessToken = longLivedData.access_token;
    }

    // 3. Fetch User's Pages to get Page Access Tokens (which never expire as long as the user token is valid)
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();
    
    console.log("DEBUG: Facebook Pages Response:", JSON.stringify(pagesData, null, 2));

    // Just grab the first page they have access to for simplicity
    const primaryPage = pagesData?.data?.[0];

    if (!primaryPage) {
      return NextResponse.redirect(`${origin}/settings?error=no_pages_found`);
    }

    // Save Page Access Token and Page ID to data.json
    data.businesses[businessId].facebook.accessToken = primaryPage.access_token;
    data.businesses[businessId].facebook.pageId = primaryPage.id;
    data.businesses[businessId].facebook.pageName = primaryPage.name;
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.redirect(`${origin}/settings?success=facebook_connected`);
  } catch (error) {
    console.error("OAuth Error:", error);
    return NextResponse.redirect(`${origin}/settings?error=server_error`);
  }
}
