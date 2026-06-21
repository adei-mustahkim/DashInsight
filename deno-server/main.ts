const corsOrigin = Deno.env.get('CORS_ORIGIN') ?? 'https://umkm-insight.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin,
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (url.pathname === '/api/health') {
    return json({
      status: 'ok',
      service: 'DashInsight Deno API',
      timestamp: new Date().toISOString(),
      runtime: 'deno',
    });
  }

  if (url.pathname === '/api/test') {
    return json({ ok: true, message: 'Deno backend scaffold active' });
  }

  return withCors(new Response('Not Found', { status: 404 }));
});
