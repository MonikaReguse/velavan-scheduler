import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const businessId = searchParams.get('state');

  if (!code || !businessId) {
    return NextResponse.redirect(`${origin}/settings?error=missing_code_or_state`);
  }

  try {
    const dataFilePath = path.join(process.cwd(), 'data.json');
    const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    const config = data.businesses[businessId].youtube;

    const redirectUri = `${origin}/api/oauth/youtube/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Google Token Error:", tokenData);
      return NextResponse.redirect(`${origin}/settings?error=google_token_failed`);
    }

    // Save tokens
    data.businesses[businessId].youtube.accessToken = tokenData.access_token;
    if (tokenData.refresh_token) {
      data.businesses[businessId].youtube.refreshToken = tokenData.refresh_token;
    }

    // Fetch YouTube Channel ID
    const ytResponse = await fetch('https://youtube.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    const ytData = await ytResponse.json();
    if (ytData.items && ytData.items.length > 0) {
      data.businesses[businessId].youtube.channelId = ytData.items[0].id;
      data.businesses[businessId].youtube.channelName = ytData.items[0].snippet.title;
    }

    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    return NextResponse.redirect(`${origin}/settings?success=youtube_connected`);

  } catch (error) {
    console.error("Google Callback Error:", error);
    return NextResponse.redirect(`${origin}/settings?error=server_error`);
  }
}
