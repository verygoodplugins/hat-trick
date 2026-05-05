# Hat Trick

Static Cloudflare Pages site for `hattrick.autojack.ai`, with a D1-backed
pilot mailing list.

## Files

- `index.html` - single-file landing page
- `functions/api/signup.js` - `POST /api/signup` waitlist endpoint
- `functions/api/checkout.js` - `POST /api/checkout` Stripe Checkout Session endpoint
- `functions/lib/email.js` - Hat Trick welcome email template
- `functions/lib/tokens.js` - unsubscribe token helper
- `functions/unsubscribe.js` - unsubscribe endpoint for email footer links
- `functions/admin/waitlist.js` - authenticated JSON/CSV waitlist export
- `schema/d1-schema.sql` - D1 schema for the `waitlist` table
- `wrangler.toml` - Pages and D1 binding config

## Deploy

```bash
cd /Users/jgarturo/Projects/OpenAI/autohub
npm run deploy:pages -- --slug=hattrick --dir=/Users/jgarturo/Projects/OpenAI/hat-trick --domain=hattrick.autojack.ai
```

For D1/Functions-aware deploys, run Wrangler from this directory:

```bash
cd /Users/jgarturo/Projects/OpenAI/hat-trick
/Users/jgarturo/Projects/OpenAI/autohub/node_modules/.bin/wrangler pages deploy . --project-name=hattrick --branch=main --commit-dirty=true --env-file /Users/jgarturo/Projects/OpenAI/autohub/.env
```

## D1

Database: `hattrick-db`

Apply schema:

```bash
/Users/jgarturo/Projects/OpenAI/autohub/node_modules/.bin/wrangler d1 execute hattrick-db --remote --file ./schema/d1-schema.sql --yes --env-file /Users/jgarturo/Projects/OpenAI/autohub/.env
```

Query signups:

```bash
/Users/jgarturo/Projects/OpenAI/autohub/node_modules/.bin/wrangler d1 execute hattrick-db --remote --command "SELECT email, source, created_at FROM waitlist ORDER BY created_at DESC;" --env-file /Users/jgarturo/Projects/OpenAI/autohub/.env
```

Admin endpoint requires an `ADMIN_TOKEN` Pages secret:

```bash
curl -H "Authorization: Bearer <token>" https://hattrick.autojack.ai/admin/waitlist
```

## Welcome Email

Welcome emails are copied from the AutoMail Resend flow. Signups still work
without email configuration, but `POST /api/signup` will return
`email_configured: false` and `email_sent: false`.

Required Pages secret:

```bash
/Users/jgarturo/Projects/OpenAI/autohub/node_modules/.bin/wrangler pages secret put RESEND_API_KEY --project-name=hattrick --env-file /Users/jgarturo/Projects/OpenAI/autohub/.env
```

The configured sender is `hello@hattrick.autojack.ai`; that sender/domain must
be verified in Resend before smoke tests will deliver. `CONFIRM_SECRET` is
optional and falls back to `ADMIN_TOKEN` or `RESEND_API_KEY` for unsubscribe
tokens.

Smoke test:

```bash
curl -s https://hattrick.autojack.ai/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke+hattrick@example.com","source":"email-smoke"}'
```

## Stripe Checkout

The support and busker cards use Stripe-hosted Checkout Sessions. Card and
wallet details stay in Stripe; the site only creates a Checkout Session and
redirects to the returned URL. Pilot support and kit deposits are one-time
payments; the monthly device plan creates a Stripe Billing subscription.
Checkout sessions override Stripe branding per session to match The Busking
Project: coral button, warm background, Montserrat, rounded controls, and the
white-hat icon.

Required Pages secret:

```bash
/Users/jgarturo/Projects/OpenAI/autohub/node_modules/.bin/wrangler pages secret put STRIPE_SECRET_KEY --project-name=hattrick --env-file /Users/jgarturo/Projects/OpenAI/autohub/.env
```

Smoke test session creation:

```bash
curl -s https://hattrick.autojack.ai/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"kind":"pilot_support","source":"stripe-smoke"}'
```

Refundable kit deposit smoke test:

```bash
curl -s https://hattrick.autojack.ai/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"kind":"kit_deposit","source":"deposit-smoke"}'
```

Monthly device-plan smoke test:

```bash
curl -s https://hattrick.autojack.ai/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount":4900,"kind":"device_monthly","source":"monthly-smoke"}'
```
