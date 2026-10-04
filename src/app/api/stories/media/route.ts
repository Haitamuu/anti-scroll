import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reelId = searchParams.get('id');
  const sessionId = request.headers.get('x-ig-session');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  }
  
  if (!reelId) {
    return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });
  }

  const dummyCsrf = 'dummy_csrf_token_12345';

  try {
    const response = await fetch(`https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${reelId}`, {
      headers: {
        'User-Agent': 'Instagram 219.0.0.12.117 Android',
        'X-IG-App-ID': '1217981644879628',
        'X-CSRFToken': dummyCsrf,
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site', // i.instagram.com est un sous-domaine
        'Cookie': `sessionid=${sessionId}; csrftoken=${dummyCsrf}`
      },
      redirect: 'manual'
    });

    if (!response.ok) {
      if (response.status === 301 || response.status === 302) {
        return NextResponse.json({ error: 'Redirected (Unauthorized)', details: response.headers.get('location') }, { status: 401 });
      }
      const text = await response.text();
      return NextResponse.json({ error: `Erreur IG ${response.status}`, details: text }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
