const APPLICATION_TYPES = new Set(['busker', 'festival', 'supporter']);

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

function clean(value, maxLength = 240) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanLong(value, maxLength = 1600) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeType(value) {
  const type = String(value || '').toLowerCase();

  return APPLICATION_TYPES.has(type) ? type : null;
}

function getTypeLabel(type) {
  if (type === 'festival') {
    return 'festival partner';
  }

  if (type === 'supporter') {
    return 'pilot supporter';
  }

  return 'busker pilot';
}

function buildAnswers(type, fields) {
  if (type === 'festival') {
    return {
      event_name: clean(fields.event_name),
      dates: clean(fields.dates),
      expected_buskers: clean(fields.expected_buskers, 120),
      current_payment_setup: cleanLong(fields.current_payment_setup),
      goals: cleanLong(fields.goals),
    };
  }

  if (type === 'supporter') {
    return {
      support_type: clean(fields.support_type, 120),
      budget_or_timeline: clean(fields.budget_or_timeline, 160),
      interest: cleanLong(fields.interest),
      introduction: cleanLong(fields.introduction),
    };
  }

  return {
    stage_name: clean(fields.stage_name),
    festival_plan: clean(fields.festival_plan, 160),
    performance_setup: cleanLong(fields.performance_setup),
    audience_size: clean(fields.audience_size, 120),
    kit_needs: cleanLong(fields.kit_needs),
  };
}

function validateAnswers(type, answers) {
  if (type === 'festival') {
    return Boolean(answers.event_name && answers.dates && answers.goals);
  }

  if (type === 'supporter') {
    return Boolean(answers.support_type && answers.interest);
  }

  return Boolean(
    answers.stage_name &&
      answers.festival_plan &&
      answers.performance_setup
  );
}

async function sendApplicationEmail({ request, env, email, name, type }) {
  if (!isEmailConfigured(env)) {
    return {
      configured: false,
      sent: false,
    };
  }

  try {
    const { createToken } = await import('../lib/tokens.js');
    const { buildApplicationEmail } = await import('../lib/email.js');
    const baseUrl = getBaseUrl(request, env);
    const secret = env.CONFIRM_SECRET || env.ADMIN_TOKEN || env.RESEND_API_KEY;
    const token = await createToken(email, secret, 60 * 60 * 24 * 30);
    const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${encodeURIComponent(token)}`;
    const { subject, html, text } = buildApplicationEmail({
      appName: env.FROM_NAME || 'Hat Trick',
      baseUrl,
      unsubscribeUrl,
      type,
      name,
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
        { success: false, error: 'Applications are unavailable.' },
        500
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid request.' }, 400);
    }

    const type = normalizeType(body.type);
    const email = clean(body.email, 320).toLowerCase();
    const name = clean(body.name);
    const organization = clean(body.organization);
    const location = clean(body.location);
    const source = clean(body.source || 'hattrick-application', 80);

    if (!type) {
      return jsonResponse(
        { success: false, error: 'Choose an application type.' },
        400
      );
    }

    if (!name) {
      return jsonResponse({ success: false, error: 'Enter your name.' }, 400);
    }

    if (!isValidEmail(email)) {
      return jsonResponse(
        { success: false, error: 'Enter a valid email address.' },
        400
      );
    }

    const answers = buildAnswers(type, body.answers || {});

    if (!validateAnswers(type, answers)) {
      return jsonResponse(
        { success: false, error: 'Complete the required questions.' },
        400
      );
    }

    const createdAt = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO applications
          (type, name, email, organization, location, answers, source, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`
      )
      .bind(
        type,
        name,
        email,
        organization || null,
        location || null,
        JSON.stringify(answers),
        source || 'hattrick-application',
        createdAt
      )
      .run();

    const confirmationEmail = await sendApplicationEmail({
      request,
      env,
      email,
      name,
      type,
    });

    return jsonResponse({
      success: true,
      message: `Your ${getTypeLabel(type)} application is in.`,
      email_configured: confirmationEmail.configured,
      email_sent: confirmationEmail.sent,
    });
  } catch {
    return jsonResponse(
      { success: false, error: 'Something went wrong. Please try again.' },
      500
    );
  }
}
