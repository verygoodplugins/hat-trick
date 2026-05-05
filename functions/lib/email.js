function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildWelcomeEmail(options = {}) {
  const {
    appName = 'Hat Trick',
    baseUrl = 'https://hattrick.autojack.ai',
    unsubscribeUrl = `${baseUrl}/unsubscribe`,
    userEmail = '',
  } = options;

  const subject = `Welcome to ${appName}`;
  const preheader =
    'You are on the Hat Trick pilot list. We will send the next build when it is ready.';
  const text = [
    `Welcome to ${appName}.`,
    '',
    'You are on the pilot list. We will send the next build and early venue invites as they open up.',
    '',
    'Hat Trick is a lightweight way to follow live music, find the right room, and help small venues turn passing interest into repeat attendance.',
    '',
    `Site: ${baseUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${escapeHtml(subject)}</title>
    <style>
      body { margin:0; padding:0; background:#101314; color:#edf4ef; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height:1.55; }
      a { color:#5ed8d8; }
      .wrap { max-width:640px; margin:0 auto; padding:32px 18px; }
      .card { background:#17201f; border:1px solid #314440; border-radius:16px; padding:32px; }
      .eyebrow { color:#f2c14e; font-size:12px; letter-spacing:.12em; text-transform:uppercase; }
      h1 { margin:10px 0 16px; font-size:30px; line-height:1.15; color:#ffffff; }
      p { margin:0 0 16px; color:#d7e2dc; }
      .button { display:inline-block; margin-top:8px; padding:13px 18px; background:#f2c14e; border-radius:10px; color:#14110f !important; text-decoration:none; font-weight:700; }
      .footer { margin-top:26px; color:#8fa29b; font-size:12px; }
      @media (max-width: 520px) {
        .card { padding:24px; }
        h1 { font-size:26px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="eyebrow">${escapeHtml(appName)}</div>
        <h1>You are on the pilot list.</h1>
        <p>Thanks${userEmail ? `, ${escapeHtml(userEmail)}` : ''}. We will send the next build and early venue invites as they open up.</p>
        <p>Hat Trick is a lightweight way to follow live music, find the right room, and help small venues turn passing interest into repeat attendance.</p>
        <a class="button" href="${escapeHtml(baseUrl)}">Visit Hat Trick</a>
        <p class="footer">You received this because you joined the Hat Trick pilot list. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>.</p>
      </div>
    </div>
    <div style="display:none;overflow:hidden;height:0;width:0;">${escapeHtml(preheader)}</div>
  </body>
</html>`;

  return { subject, html, text };
}

function getApplicationCopy(type) {
  if (type === 'festival') {
    return {
      label: 'Festival Partnership',
      subject: 'We received your Hat Trick festival note',
      title: 'Your festival note is in.',
      body:
        'Thanks for opening a conversation about bringing Hat Trick to your venue. We will look at the dates, performance environment, and artist onboarding fit before coming back with a practical next step.',
      next: 'We will reply with the lightest viable pilot shape for your setting.',
    };
  }

  if (type === 'supporter') {
    return {
      label: 'Pilot Support',
      subject: 'We received your Hat Trick support note',
      title: 'Your support note is in.',
      body:
        'Thanks for backing the first Hat Trick field tests. We will review the fit and follow up with a concrete sponsorship, investment, or partner conversation.',
      next: 'We will come back with the clearest way to help the pilot move.',
    };
  }

  return {
    label: 'Busker Pilot',
    subject: 'We received your Hat Trick pilot application',
    title: 'Your pilot application is in.',
    body:
      'Thanks for applying to trial Hat Trick. We will review your pitch, festival plans, and kit needs before opening the next onboarding call.',
    next: 'A refundable deposit can still reserve kit priority, but your application is recorded either way.',
  };
}

export function buildApplicationEmail(options = {}) {
  const {
    appName = 'Hat Trick',
    baseUrl = 'https://hattrick.autojack.ai',
    type = 'busker',
    name = '',
    unsubscribeUrl = `${baseUrl}/unsubscribe`,
  } = options;
  const copy = getApplicationCopy(type);
  const greeting = name ? `Thanks, ${name}.` : 'Thanks.';
  const preheader =
    'Your Hat Trick application has been received. We will follow up with the next practical step.';
  const subject = copy.subject;
  const text = [
    copy.title,
    '',
    greeting,
    copy.body,
    '',
    copy.next,
    '',
    `Site: ${baseUrl}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>${escapeHtml(subject)}</title>
    <style>
      body { margin:0; padding:0; background:#080a10; color:#e2e8f4; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height:1.55; }
      a { color:#00e5ff; }
      .wrap { max-width:680px; margin:0 auto; padding:34px 18px; }
      .card { background:#0d0f18; border:1px solid rgba(0,229,255,.24); padding:34px; box-shadow:0 0 42px rgba(0,229,255,.07); }
      .mark { width:42px; height:42px; border:2px solid #00e5ff; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:#00e5ff; font-weight:800; font-size:12px; letter-spacing:.08em; margin-bottom:22px; }
      .eyebrow { color:#ffb800; font-size:12px; letter-spacing:.18em; text-transform:uppercase; }
      h1 { margin:10px 0 16px; font-size:32px; line-height:1.12; color:#ffffff; letter-spacing:-.02em; }
      p { margin:0 0 16px; color:#c8d2df; }
      .note { border-left:2px solid #00e5ff; padding:12px 0 12px 18px; color:#e2e8f4; background:rgba(0,229,255,.05); }
      .button { display:inline-block; margin-top:10px; padding:14px 20px; background:#00e5ff; color:#080a10 !important; text-decoration:none; font-weight:800; letter-spacing:.08em; text-transform:uppercase; font-size:12px; }
      .footer { margin-top:26px; color:rgba(226,232,244,.48); font-size:12px; }
      @media (max-width: 520px) {
        .card { padding:26px; }
        h1 { font-size:27px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="mark">HT</div>
        <div class="eyebrow">${escapeHtml(appName)} · ${escapeHtml(copy.label)}</div>
        <h1>${escapeHtml(copy.title)}</h1>
        <p>${escapeHtml(greeting)} ${escapeHtml(copy.body)}</p>
        <p class="note">${escapeHtml(copy.next)}</p>
        <a class="button" href="${escapeHtml(baseUrl)}#involved">Back to Hat Trick</a>
        <p class="footer">You received this because you submitted a Hat Trick application. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>.</p>
      </div>
    </div>
    <div style="display:none;overflow:hidden;height:0;width:0;">${escapeHtml(preheader)}</div>
  </body>
</html>`;

  return { subject, html, text };
}
