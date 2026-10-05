import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const sessionId = request.headers.get('x-ig-session');
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  }

  const { mediaId } = await request.json();
  if (!mediaId) {
    return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
  }

  try {
    // Utilisation de l'API mobile pour éviter la vérification stricte du CSRF Token exigée par l'API Web
    const response = await fetch('https://i.instagram.com/api/v1/story_interactions/send_story_like/', {
      method: 'POST',
      headers: {
        'User-Agent': 'Instagram 219.0.0.12.117 Android',
        'X-IG-App-ID': '1217981644879628',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `sessionid=${sessionId}`
      },
      body: new URLSearchParams({
        media_id: mediaId
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: `Erreur IG ${response.status}`, details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
