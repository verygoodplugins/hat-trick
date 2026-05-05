import { verifyToken } from './lib/tokens.js';

function htmlResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function page(title, message) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      body { margin:0; padding:48px 20px; background:#101314; color:#edf4ef; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align:center; }
      main { max-width:560px; margin:0 auto; background:#17201f; border:1px solid #314440; border-radius:16px; padding:32px; }
      h1 { margin:0 0 12px; font-size:28px; }
      p { margin:0; color:#c9d8d1; line-height:1.55; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
    </main>
  </body>
</html>`;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const secret =
    env.CONFIRM_SECRET || env.ADMIN_TOKEN || env.RESEND_API_KEY || '';

  if (!secret) {
    return htmlResponse(
      page('Invalid link', 'This unsubscribe link is not configured yet.'),
      400
    );
  }

  const email = await verifyToken(token, secret);

  if (!email) {
    return htmlResponse(
      page(
        'Invalid link',
        'This unsubscribe link is invalid or expired. Reply to the welcome email if you need help.'
      ),
      400
    );
  }

  const db = env.D1 || env.DB;

  if (!db) {
    return htmlResponse(
      page('Unavailable', 'The mailing list is unavailable.'),
      500
    );
  }

  try {
    await db
      .prepare('UPDATE waitlist SET unsubscribed = 1 WHERE email = ?')
      .bind(email.toLowerCase())
      .run();

    return htmlResponse(
      page(
        'Unsubscribed',
        `${email} has been removed from the Hat Trick pilot list.`
      )
    );
  } catch {
    return htmlResponse(
      page('Unsubscribe failed', 'Please try the link again in a moment.'),
      500
    );
  }
}
