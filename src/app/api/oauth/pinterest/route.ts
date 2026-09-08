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
  const clientId = data.businesses[businessId]?.pinterest?.clientId;

  if (!clientId) {
    return NextResponse.redirect(new URL(`/settings?error=configure_first`, request.url));
  }

  const redirectUri = `http://localhost:3000/api/oauth/pinterest/callback`;
  const state = businessId; 
  // Pinterest required scopes for posting pins
  const scope = "boards:read,boards:write,pins:read,pins:write";
  
  const pinterestLoginUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  
  return NextResponse.redirect(pinterestLoginUrl);
}
