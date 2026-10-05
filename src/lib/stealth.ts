export async function getStealthHeaders(request: Request, sessionId: string, requireCsrf: boolean = false, isMobileApi: boolean = false) {
  // 1. ANOMALIE CORRIGÉE : Empreinte de navigateur (User-Agent) dynamique.
  // On récupère le vrai appareil de l'utilisateur (son iPhone) plutôt que de coder en dur un faux appareil.
  const realUserAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  
  // 2. ANOMALIE CORRIGÉE : Usurpation d'IP (X-Forwarded-For).
  // Instagram voit l'IP des serveurs de Vercel. En envoyant cette entête, on dit à Instagram :
  // "Je suis un proxy, la vraie adresse IP résidentielle est celle-ci".
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  let csrfToken = '';

  // 3. ANOMALIE CORRIGÉE : Vrai jeton CSRF au lieu d'un faux codé en dur ("dummy_csrf...")
  if (requireCsrf) {
    try {
      const initRes = await fetch('https://www.instagram.com/', {
        headers: { 
          'Cookie': `sessionid=${sessionId}`, 
          'User-Agent': realUserAgent,
          'X-Forwarded-For': clientIp
        }
      });
      const setCookie = initRes.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/csrftoken=([^;]+)/);
        if (match) csrfToken = match[1];
      }
    } catch (e) {
      console.error("Erreur génération CSRF", e);
    }
  }

  const baseHeaders: Record<string, string> = {
    'User-Agent': realUserAgent,
    'X-Forwarded-For': clientIp,
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': `sessionid=${sessionId}${csrfToken ? `; csrftoken=${csrfToken}` : ''}`
  };

  if (isMobileApi) {
    // Entêtes pour i.instagram.com (API Mobile)
    return {
      ...baseHeaders,
      'X-IG-App-ID': '1217981644879628',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Origin': 'https://www.instagram.com',
      'Referer': 'https://www.instagram.com/',
    };
  } else {
    // Entêtes pour www.instagram.com (API Web)
    return {
      ...baseHeaders,
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '129477',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.instagram.com',
      'Referer': 'https://www.instagram.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {})
    };
  }
}
