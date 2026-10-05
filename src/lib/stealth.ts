export async function getStealthHeaders(request: Request, sessionId: string, isMobileApi: boolean = false) {
  const realUserAgent = request.headers.get('user-agent') || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

  const secChUa = request.headers.get('sec-ch-ua') || '"Chromium";v="122", "Not(A:Brand";v="24"';
  const secChUaMobile = request.headers.get('sec-ch-ua-mobile') || '?1';
  const secChUaPlatform = request.headers.get('sec-ch-ua-platform') || '"iOS"';

  const baseHeaders: Record<string, string> = {
    'User-Agent': realUserAgent,
    'X-Forwarded-For': clientIp,
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cookie': `sessionid=${sessionId}`
  };

  if (isMobileApi) {
    const mobileAppUserAgent = 'Instagram 219.0.0.12.117 Android';
    return {
      ...baseHeaders,
      'User-Agent': mobileAppUserAgent,
      'X-IG-App-ID': '1217981644879628',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Origin': 'https://www.instagram.com',
      'Referer': 'https://www.instagram.com/',
    };
  } else {
    return {
      ...baseHeaders,
      'sec-ch-ua': secChUa,
      'sec-ch-ua-mobile': secChUaMobile,
      'sec-ch-ua-platform': secChUaPlatform,
      'X-IG-App-ID': '936619743392459',
      'X-ASBD-ID': '129477',
      'X-Instagram-AJAX': '1',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.instagram.com',
      'Referer': 'https://www.instagram.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };
  }
}
