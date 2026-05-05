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
