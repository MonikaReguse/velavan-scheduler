import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
  }

  const dataFilePath = path.join(process.cwd(), 'data.json');
  if (!fs.existsSync(dataFilePath)) {
    return NextResponse.redirect(new URL(`/settings?error=configure_first`, request.url));
  }
  
  const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  const clientId = data.businesses[businessId]?.facebook?.clientId;

  if (!clientId) {
    return NextResponse.redirect(new URL(`/settings?error=configure_first`, request.url));
  }

  const redirectUri = `http://localhost:3000/api/oauth/facebook/callback`;
  const state = businessId; 
  // Minimum scopes required for Page publishing and Instagram
  const scope = "pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish";
  
  const fbLoginUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}&response_type=code`;
  
  return NextResponse.redirect(fbLoginUrl);
}
