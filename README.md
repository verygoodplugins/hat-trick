# Hat Trick

Static Cloudflare Pages site for `hattrick.autojack.ai`, with a D1-backed
pilot mailing list.

## Files

- `index.html` - single-file landing page
- `functions/api/signup.js` - `POST /api/signup` waitlist endpoint
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
