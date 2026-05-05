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

function isDisabled(value) {
  return String(value || '').toLowerCase() === 'false';
}

function isEmailConfigured(env) {
  return Boolean(env.RESEND_API_KEY) && !isDisabled(env.SEND_WELCOME_EMAIL);
}

function getBaseUrl(request, env) {
  const url = new URL(request.url);

  return env.BASE_URL || `${url.protocol}//${url.host}`;
}

function getFrom(env) {
  const fromEmail = env.FROM_EMAIL || 'hello@hattrick.autojack.ai';
  const fromName = env.FROM_NAME || 'Hat Trick';

  return `${fromName} <${fromEmail}>`;
}

async function sendWelcomeEmail({ request, env, email }) {
  if (!isEmailConfigured(env)) {
    return {
      configured: false,
      sent: false,
    };
  }

  try {
    const { createToken } = await import('../lib/tokens.js');
    const { buildWelcomeEmail } = await import('../lib/email.js');
    const baseUrl = getBaseUrl(request, env);
    const secret = env.CONFIRM_SECRET || env.ADMIN_TOKEN || env.RESEND_API_KEY;
    const token = await createToken(email, secret, 60 * 60 * 24 * 30);
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = buildWelcomeEmail({
      appName: env.FROM_NAME || 'Hat Trick',
      baseUrl,
      unsubscribeUrl,
      userEmail: email,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFrom(env),
        to: [email],
        subject,
        html,
        text,
      }),
    });

    return {
      configured: true,
      sent: response.ok,
    };
  } catch {
    return {
      configured: true,
      sent: false,
    };
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const db = env.D1 || env.DB;
    if (!db) {
      return jsonResponse(
        { success: false, error: 'Waitlist is unavailable.' },
        500
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid request.' }, 400);
    }

    const email = String(body.email || '')
      .trim()
      .toLowerCase();
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
        email_configured: isEmailConfigured(env),
        email_sent: false,
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
    const welcomeEmail = await sendWelcomeEmail({ request, env, email });

    return jsonResponse({
      success: true,
      message: 'You are on the pilot list.',
      position: count?.total || null,
      email_configured: welcomeEmail.configured,
      email_sent: welcomeEmail.sent,
    });
  } catch {
    return jsonResponse(
      { success: false, error: 'Something went wrong. Please try again.' },
      500
    );
  }
}
