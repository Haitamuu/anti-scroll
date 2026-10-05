import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const sessionId = request.headers.get('x-ig-session');
  const csrfToken = request.headers.get('x-ig-csrf');
  
  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  if (!csrfToken) return NextResponse.json({ error: 'CSRF Token is required' }, { status: 401 });

  const { mediaId } = await request.json();
  if (!mediaId) return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });

  try {
    let uid = sessionId.split('%3A')[0];
    if (uid === sessionId) uid = sessionId.split(':')[0];
    
    const uuid = crypto.randomUUID();

    // L'API iOS n'utilise généralement pas de signed_body, un simple POST urlencoded suffit.
    const body = new URLSearchParams({
      media_id: mediaId,
      _csrftoken: csrfToken,
      _uid: uid,
      _uuid: uuid,
      module_name: 'viewer_story'
    });

    const iosAppUserAgent = 'Instagram 219.0.0.12.117 (iPhone13,3; iOS 15_2; fr_FR; fr-FR; scale=3.00; 1170x2532; 346903215) AppleWebKit/420+';

    const response = await fetch('https://i.instagram.com/api/v1/story_interactions/send_story_like/', {
      method: 'POST',
      headers: {
        'User-Agent': iosAppUserAgent,
        'X-IG-App-ID': '1217981644879628',
        'X-IG-Device-ID': uuid,
        'X-CSRFToken': csrfToken,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': `sessionid=${sessionId}; csrftoken=${csrfToken}`,
        'Accept-Language': 'fr-FR',
      },
      body: body
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status !== 'ok') {
      return NextResponse.json(
        { error: `Erreur IG iOS ${response.status}`, details: data }, 
        { status: response.status === 200 ? 400 : response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
