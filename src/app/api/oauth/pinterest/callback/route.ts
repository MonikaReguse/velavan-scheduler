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
  const clientId = data.businesses[businessId]?.pinterest?.clientId;
  const clientSecret = data.businesses[businessId]?.pinterest?.clientSecret;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/settings?error=missing_credentials`);
  }

  const redirectUri = `http://localhost:3000/api/oauth/pinterest/callback`;

  try {
    // Exchange code for Access Token
    const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      },
      body: params.toString(),
    });
    
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Pinterest Token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/settings?error=token_failed`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // Save Access Token and Refresh Token to data.json
    data.businesses[businessId].pinterest.accessToken = accessToken;
    if (refreshToken) {
      data.businesses[businessId].pinterest.refreshToken = refreshToken;
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.redirect(`${origin}/settings?success=pinterest_connected`);
  } catch (error) {
    console.error("Pinterest OAuth Error:", error);
    return NextResponse.redirect(`${origin}/settings?error=server_error`);
  }
}
