# server

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.js
```

## Environment

Copy `.env.example` to `.env` and fill it in. Bun loads `.env` automatically, so there is no
dotenv dependency.

| variable                    | required | notes                                                             |
|-----------------------------|----------|-------------------------------------------------------------------|
| `SUPABASE_URL`              | yes      | Project Settings > API                                            |
| `SUPABASE_SERVICE_ROLE_KEY` | yes      | Bypasses row level security — server-side only, never in `app/`   |
| `STORE_BASE_URL`            | no       | Overrides the scraped store; defaults to the INE demo store       |
| `ADMIN_SECRET`              | yes      | Shared secret for the admin routes (`x-admin-secret` header or `Authorization: Bearer`); unset disables them (503) |

`.env` is gitignored; `.env.example` is committed. `src/lib/db.js` validates both required vars
and throws `DatabaseConfigError` naming whichever is missing.

Database access uses `@supabase/supabase-js` over HTTPS (PostgREST), not a direct Postgres
connection, so there is no TCP pool to manage on Render.

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
