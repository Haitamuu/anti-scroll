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
    // 1. Extraction de l'ID utilisateur (_uid) depuis le sessionid
    let uid = sessionId.split('%3A')[0];
    if (uid === sessionId) {
      uid = sessionId.split(':')[0]; // Sécurité si c'est formaté différemment
    }

    // 2. Génération d'un UUID unique pour simuler un vrai appareil mobile
    const uuid = crypto.randomUUID();

    // 3. Construction du corps de la requête EXACTEMENT comme l'application Android
    const body = new URLSearchParams({
      media_id: mediaId,
      _csrftoken: csrfToken,
      _uid: uid,
      _uuid: uuid,
      container_module: 'reel_feed_timeline'
    });

    // 4. L'empreinte de la VRAIE application Android (très important pour l'API Mobile)
    const mobileAppUserAgent = 'Instagram 219.0.0.12.117 Android';

    const response = await fetch('https://i.instagram.com/api/v1/story_interactions/send_story_like/', {
      method: 'POST',
      headers: {
        'User-Agent': mobileAppUserAgent,
        'X-IG-App-ID': '1217981644879628',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': `sessionid=${sessionId}; csrftoken=${csrfToken}`,
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      body: body
    });

    const data = await response.json().catch(() => ({}));

    // Si le statut HTTP n'est pas bon, ou que l'API a ignoré le like (statut 'fail')
    if (!response.ok || data.status !== 'ok') {
      return NextResponse.json(
        { error: `Erreur IG ${response.status}`, details: data }, 
        { status: response.status === 200 ? 400 : response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
