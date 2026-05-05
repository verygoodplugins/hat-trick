function authorize(request, env) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7)
    : new URL(request.url).searchParams.get('token');

  return !!token && !!env.ADMIN_TOKEN && token === env.ADMIN_TOKEN;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet({ request, env }) {
  if (!authorize(request, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = env.D1 || env.DB;
  if (!db) {
    return jsonResponse({ error: 'D1 binding not found.' }, 500);
  }

  const { results } = await db
    .prepare(
      'SELECT email, source, created_at, confirmed, unsubscribed FROM waitlist ORDER BY created_at DESC LIMIT 1000'
    )
    .all();
  const stats = await db.prepare('SELECT * FROM waitlist_stats').first();

  return jsonResponse({ stats, signups: results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!authorize(request, env)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const db = env.D1 || env.DB;
  if (!db) {
    return new Response('D1 binding not found.', { status: 500 });
  }

  const { results } = await db
    .prepare(
      'SELECT email, source, created_at, confirmed, unsubscribed FROM waitlist ORDER BY created_at DESC'
    )
    .all();

  const csv = [
    'Email,Source,Signup Date,Confirmed,Unsubscribed',
    ...(results || []).map(row =>
      [
        row.email,
        row.source,
        row.created_at,
        row.confirmed,
        row.unsubscribed,
      ]
        .map(value => `"${String(value ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="hattrick-waitlist.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
