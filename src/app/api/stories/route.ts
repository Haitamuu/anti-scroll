import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const sessionId = request.headers.get('x-ig-session');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  }

  const dummyCsrf = 'dummy_csrf_token_12345';

  try {
    const response = await fetch('https://www.instagram.com/api/v1/feed/reels_tray/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'X-CSRFToken': dummyCsrf,
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Cookie': `sessionid=${sessionId}; csrftoken=${dummyCsrf}`
      }
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
