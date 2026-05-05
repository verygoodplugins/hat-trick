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

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
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
      `SELECT type, name, email, organization, location, answers, source, status, created_at
       FROM applications
       ORDER BY created_at DESC
       LIMIT 1000`
    )
    .all();
  const stats = await db.prepare('SELECT * FROM application_stats').first();

  return jsonResponse({ stats, applications: results || [] });
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
      `SELECT type, name, email, organization, location, answers, source, status, created_at
       FROM applications
       ORDER BY created_at DESC`
    )
    .all();

  const csv = [
    'Type,Name,Email,Organization,Location,Answers,Source,Status,Created At',
    ...(results || []).map(row =>
      [
        row.type,
        row.name,
        row.email,
        row.organization,
        row.location,
        row.answers,
        row.source,
        row.status,
        row.created_at,
      ]
        .map(csvEscape)
        .join(',')
    ),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="hattrick-applications.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
