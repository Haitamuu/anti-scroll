import { NextResponse } from 'next/server';
import { getStealthHeaders } from '@/lib/stealth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reelId = searchParams.get('id');
  const sessionId = request.headers.get('x-ig-session');

  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  if (!reelId) return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });

  try {
    // Utilisation de la route Mobile avec stealth headers
    const headers = await getStealthHeaders(request, sessionId, true);

    const response = await fetch(`https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${reelId}`, {
      headers: headers,
      redirect: 'manual'
    });

    if (!response.ok) {
      if (response.status === 301 || response.status === 302) {
        return NextResponse.json({ error: 'Redirected (Unauthorized)' }, { status: 401 });
      }
      return NextResponse.json({ error: `Erreur IG ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
