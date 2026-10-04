import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const sessionId = request.headers.get('x-ig-session');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  }

  try {
    const response = await fetch('https://i.instagram.com/api/v1/direct_v2/inbox/', {
      headers: {
        'User-Agent': 'Instagram 219.0.0.12.117 Android',
        'Cookie': `sessionid=${sessionId}`
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
