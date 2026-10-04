import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const sessionId = request.headers.get('x-ig-session');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://i.instagram.com/api/v1/direct_v2/inbox/?persistentBadging=true&folder=0&limit=10', {
      headers: {
        'User-Agent': 'Instagram 219.0.0.12.117 Android',
        'X-IG-App-ID': '936619743392459',
        'Cookie': `sessionid=${sessionId}`
      },
      redirect: 'manual' // Empêche fetch de planter en cas de boucle de redirection
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
