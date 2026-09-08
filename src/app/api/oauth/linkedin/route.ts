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
  const clientId = data.businesses[businessId]?.linkedin?.clientId;

  if (!clientId) {
    return NextResponse.redirect(new URL(`/settings?error=configure_first`, request.url));
  }

  const redirectUri = `http://localhost:3000/api/oauth/linkedin/callback`;
  const state = businessId; 
  // Required scopes for posting to LinkedIn
  const scope = "w_member_social openid profile email";
  
  const linkedInLoginUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
  
  return NextResponse.redirect(linkedInLoginUrl);
}
