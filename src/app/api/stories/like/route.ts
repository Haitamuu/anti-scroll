import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const sessionId = request.headers.get('x-ig-session');
  const csrfToken = request.headers.get('x-ig-csrf');
  
  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  if (!csrfToken) return NextResponse.json({ error: 'CSRF Token is required' }, { status: 401 });

  const { mediaId } = await request.json();
  if (!mediaId) return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });

  try {
    // 1. On retourne sur l'API WEB pure, car l'API mobile a probablement mis à jour ses clés HMAC secrètes.
    // L'API Web est beaucoup plus indulgente dès lors que l'on donne un VRAI csrfToken (ce que l'utilisateur fait maintenant).
    const response = await fetch(`https://www.instagram.com/api/v1/story_interactions/send_story_like/`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'X-IG-App-ID': '936619743392459', // App ID officiel Instagram Web Mobile
        'X-ASBD-ID': '129477',
        'X-CSRFToken': csrfToken,
        'X-Instagram-AJAX': '1',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.instagram.com',
        'Referer': `https://www.instagram.com/`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `sessionid=${sessionId}; csrftoken=${csrfToken}`
      },
      body: new URLSearchParams({
        media_id: mediaId,
      })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Réponse non-JSON", details: text }, { status: response.status === 200 ? 400 : response.status });
    }

    if (!response.ok || data.status !== 'ok') {
      return NextResponse.json(
        { error: `Erreur IG Web ${response.status}`, details: data }, 
        { status: response.status === 200 ? 400 : response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
