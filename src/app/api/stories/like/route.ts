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
    const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

    // ÉTAPE 1 : Simuler une visite d'un humain sur la page d'accueil pour obtenir un VRAI jeton CSRF de sécurité.
    // Cela rend la requête légitime aux yeux des robots anti-spam d'Instagram.
    const initRes = await fetch('https://www.instagram.com/', {
      headers: {
        'Cookie': `sessionid=${sessionId}`,
        'User-Agent': userAgent
      }
    });

    let csrfToken = 'missing_token';
    
    // Extraction du vrai token depuis les cookies renvoyés par Instagram
    const setCookie = initRes.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/csrftoken=([^;]+)/);
      if (match) {
        csrfToken = match[1];
      }
    }

    // ÉTAPE 2 : Envoyer le "Like" sur l'API Web officielle avec le vrai Token et les en-têtes exacts de Safari iPhone.
    const response = await fetch('https://www.instagram.com/api/v1/story_interactions/send_story_like/', {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'X-IG-App-ID': '936619743392459', // L'ID officiel du site Web Instagram
        'X-ASBD-ID': '129477',
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': `sessionid=${sessionId}; csrftoken=${csrfToken}`
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
