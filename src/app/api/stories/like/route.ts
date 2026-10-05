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

    // Construction stricte du payload
    const payloadObj = {
      _csrftoken: csrfToken,
      _uid: uid,
      _uuid: uuid,
      media_id: mediaId,
      module_name: 'viewer_story',
      radio_type: 'wifi-none'
    };
    const payloadStr = JSON.stringify(payloadObj);

    // Clé publique correspondant aux anciennes versions d'Instagram
    const IG_SIG_KEY = '5ad7d6f013666cc93c88fc8af940348bd067b68f0dce3c85122a923f4f74b251';
    const signature = crypto.createHmac('sha256', IG_SIG_KEY).update(payloadStr).digest('hex');

    const body = new URLSearchParams({
      ig_sig_key_version: '4',
      signed_body: `${signature}.${payloadStr}`
    });

    // Empreinte EXACTE correspondant à la clé IG_SIG_KEY ci-dessus
    const exactUserAgent = 'Instagram 114.0.0.38.120 Android (28/9; 320dpi; 720x1280; samsung; SM-G930F; heroqltevzw; qcom; en_US; 170469737)';

    const response = await fetch('https://i.instagram.com/api/v1/story_interactions/send_story_like/', {
      method: 'POST',
      headers: {
        'User-Agent': exactUserAgent,
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
        { error: `Erreur IG Android114 ${response.status}`, details: data }, 
        { status: response.status === 200 ? 400 : response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
