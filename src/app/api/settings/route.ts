import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Helper to read data from Firestore
async function readData() {
  const docRef = doc(db, 'app_data', 'settings');
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    const defaultData = { businesses: {} };
    await setDoc(docRef, defaultData);
    return defaultData;
  }
}

// Helper to write data to Firestore
async function writeData(data: any) {
  const docRef = doc(db, 'app_data', 'settings');
  await setDoc(docRef, data, { merge: true });
}

export async function POST(request: Request) {
  try {
    const { businessId, platform, clientId, clientSecret, disconnect } = await request.json();

    if (!businessId || !platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data: any = await readData();

    if (!data.businesses[businessId]) {
      data.businesses[businessId] = {};
    }
    
    if (!data.businesses[businessId][platform]) {
      data.businesses[businessId][platform] = {};
    }

    if (disconnect) {
      delete data.businesses[businessId][platform].accessToken;
    } else {
      data.businesses[businessId][platform].clientId = clientId;
      data.businesses[businessId][platform].clientSecret = clientSecret;
    }

    await writeData(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    const data: any = await readData();
    const config = data.businesses[businessId] || {};

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
