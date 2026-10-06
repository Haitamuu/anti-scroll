import { NextResponse } from 'next/server';
import { getStealthHeaders } from '@/lib/stealth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reelId = searchParams.get('id');
  const sessionId = request.headers.get('x-ig-session');

  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });
  if (!reelId) return NextResponse.json({ error: 'Reel ID is required' }, { status: 400 });

  try {
    // Utilisation de la route Mobile avec stealth headers
    const headers = await getStealthHeaders(request, sessionId, true);

    const response = await fetch(`https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${reelId}`, {
      headers: headers,
      redirect: 'manual'
    });

    if (!response.ok) {
      if (response.status === 301 || response.status === 302) {
        return NextResponse.json({ error: 'Session expirée ou bloquée', details: 'Instagram a renvoyé 302' }, { status: 401 });
      }
      return NextResponse.json({ error: `Erreur IG ${response.status}`, details: await response.text().catch(()=>'') }, { status: response.status });
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ error: 'Réponse non-JSON', details: "Instagram a renvoyé du HTML (blocage Vercel ou session invalide)." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("API /media error:", error);
    return NextResponse.json({ error: 'Erreur Serveur', details: error.message || error.toString() }, { status: 500 });
  }
}
