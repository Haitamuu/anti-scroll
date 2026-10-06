import { NextResponse } from 'next/server';
import { getStealthHeaders } from '@/lib/stealth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const sessionId = request.headers.get('x-ig-session');
  if (!sessionId) return NextResponse.json({ error: 'Session ID is required' }, { status: 401 });

  try {
    const headers = await getStealthHeaders(request, sessionId, false);
    
    const response = await fetch('https://www.instagram.com/api/v1/feed/reels_tray/', {
      headers: headers,
      redirect: 'manual'
    });

    if (response.status === 301 || response.status === 302) {
      return NextResponse.json({ error: "Session expirée ou bloquée", details: "Instagram demande une reconnexion. Vérifiez votre sessionid." }, { status: 401 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Erreur IG ${response.status}`, details: await response.text().catch(()=>'') }, { status: response.status });
    }

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ error: 'Réponse non-JSON', details: "Instagram a renvoyé du HTML au lieu de JSON (blocage probable de Vercel)." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("API /stories error:", error);
    return NextResponse.json({ error: 'Erreur Serveur', details: error.message || error.toString() }, { status: 500 });
  }
}
