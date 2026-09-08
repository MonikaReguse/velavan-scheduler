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
  const clientId = data.businesses[businessId]?.linkedin?.clientId;
  const clientSecret = data.businesses[businessId]?.linkedin?.clientSecret;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${origin}/settings?error=missing_credentials`);
  }

  const redirectUri = `http://localhost:3000/api/oauth/linkedin/callback`;

  try {
    // 1. Exchange code for Access Token
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("LinkedIn Token exchange failed:", tokenData);
      return NextResponse.redirect(`${origin}/settings?error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile to get the LinkedIn 'urn:li:person:ID'
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const profileData = await profileRes.json();
    
    if (!profileData.sub) {
      console.error("LinkedIn Profile fetch failed:", profileData);
      return NextResponse.redirect(`${origin}/settings?error=profile_failed`);
    }

    const authorUrn = `urn:li:person:${profileData.sub}`;

    // Save Access Token and Author URN to data.json
    data.businesses[businessId].linkedin.accessToken = accessToken;
    data.businesses[businessId].linkedin.authorUrn = authorUrn;
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

    return NextResponse.redirect(`${origin}/settings?success=linkedin_connected`);
  } catch (error) {
    console.error("LinkedIn OAuth Error:", error);
    return NextResponse.redirect(`${origin}/settings?error=server_error`);
  }
}
