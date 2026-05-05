function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost({ request, env }) {
  try {
    const db = env.D1 || env.DB;
    if (!db) {
      return jsonResponse({ success: false, error: 'Waitlist is unavailable.' }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid request.' }, 400);
    }

    const email = String(body.email || '').trim().toLowerCase();
    const source = String(body.source || 'hattrick-landing')
      .trim()
      .slice(0, 80);

    if (!isValidEmail(email)) {
      return jsonResponse(
        { success: false, error: 'Enter a valid email address.' },
        400
      );
    }

    const existing = await db
      .prepare('SELECT email FROM waitlist WHERE email = ?')
      .bind(email)
      .first();

    if (existing) {
      const count = await db
        .prepare('SELECT COUNT(*) AS total FROM waitlist')
        .first();
      return jsonResponse({
        success: true,
        message: 'You are already on the pilot list.',
        position: count?.total || null,
      });
    }

    await db
      .prepare(
        'INSERT INTO waitlist (email, source, created_at, confirmed) VALUES (?, ?, ?, 1)'
      )
      .bind(email, source || 'hattrick-landing', new Date().toISOString())
      .run();

    const count = await db
      .prepare('SELECT COUNT(*) AS total FROM waitlist')
      .first();

    return jsonResponse({
      success: true,
      message: 'You are on the pilot list.',
      position: count?.total || null,
    });
  } catch {
    return jsonResponse(
      { success: false, error: 'Something went wrong. Please try again.' },
      500
    );
  }
}
