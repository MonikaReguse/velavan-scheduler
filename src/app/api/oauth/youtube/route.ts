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
  if (!fs.existsSync(dataFilePath)) return NextResponse.redirect(`${origin}/settings?error=configure_first`);
  
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  const config = data.businesses[businessId]?.youtube;

  if (!config || !config.clientId) {
    return NextResponse.redirect(`${origin}/settings?error=configure_first`);
  }

  const redirectUri = `${origin}/api/oauth/youtube/callback`;
  const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${businessId}`;

  return NextResponse.redirect(authUrl);
}
