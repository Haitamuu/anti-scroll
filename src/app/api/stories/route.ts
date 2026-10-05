import { NextResponse } from 'next/server';
import { getStealthHeaders } from '@/lib/stealth';

export async function GET(request: Request) {
  const sessionId = request.headers.get('x-ig-session');
  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });

  try {
    const headers = await getStealthHeaders(request, sessionId, false, false);
    
    const response = await fetch('https://www.instagram.com/api/v1/feed/reels_tray/', {
      headers: headers
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Erreur IG ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
