import { NextResponse } from 'next/server';
import { getStealthHeaders } from '@/lib/stealth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const sessionId = request.headers.get('x-ig-session');
  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });

  const { mediaId } = await request.json();
  if (!mediaId) return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });

  try {
    // Rebasculement sur l'API Mobile (plus permissive sur le CSRF), 
    // en gardant le système d'IP spoofing de stealth.ts.
    const headers = await getStealthHeaders(request, sessionId, false, true);

    const response = await fetch('https://i.instagram.com/api/v1/story_interactions/send_story_like/', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        media_id: mediaId
      })
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
