# PricePulse — Frontend API Guide

Everything the frontend needs: every endpoint, its inputs, its outputs, and the types.

- Base URL (prod): **TBD** (Render URL)
- Base URL (local): `http://localhost:3000`
- All responses are `application/json`.
- Codebase reference: `Session5.md` (build), `apiPlan.md` (roles), `apiQueries.md` (curl).

---

## ⚠️ Read this before writing any frontend code

**1. Do not put the admin secret in the frontend. Ever.**

The admin routes are gated by a single shared `ADMIN_SECRET`. Anything shipped to a browser is
public — `view-source`, the Network tab, and the bundle are all readable. If the frontend holds
the secret, the gate is decorative.

Practical rule: **the frontend calls the public endpoints directly; anything admin goes through
your own backend.** The likely shape is a small server-side proxy (or just calling `track` from
the backend during onboarding) rather than exposing `POST /track` to the browser.

**2. CORS is not configured yet.**

The API does not send `Access-Control-Allow-Origin`. A browser app on a different origin
(Vercel → Render) will be **blocked by CORS** on every request until that's added to
`src/index.js`. `curl` works (no CORS enforcement); the browser won't. Ask the backend for:

```js
app.use(cors({ origin: "https://<your-vercel-app>" }));
```

**3. Only two "roles", and there is no login.**

There is no session, no user id, no token for normal use. Public reads need nothing. That's
intentional (`Schema.md` §5.4 — single-user app).

---

## 1. Endpoint overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | public | health check |
| GET | `/products` | public | full catalog (762 rows, heavy) |
| GET | `/products/search?q=` | public | name search (light rows) |
| GET | `/products/:id` | public | product detail incl. `specs` |
| GET | `/products/:id/price-history` | public | price series for the chart |
| GET | `/alerts?productId=` | public | **active** alert rules |
| GET | `/dashboard` | public | tracked products + latest price + health |
| POST | `/scheduler/run` | admin | trigger a scrape pass |
| GET | `/scrape-logs` | admin | scrape audit trail |
| POST | `/track` | admin | start tracking a product |
| DELETE | `/track/:id` | admin | pause tracking |
| POST | `/alerts` | admin | ensure the two default alert rules |
| DELETE | `/alerts/:id` | admin | disable an alert rule |

---

## 2. Conventions

| thing | rule |
|---|---|
| `product_id` / `:id` | **integer**, positive, dense `1..1000`. Never a uuid. |
| alert / log / price ids | **uuid strings** |
| timestamps | ISO 8601 strings, UTC, e.g. `"2026-09-19T12:31:11.751+00:00"` |
| money | JSON numbers (Postgres `numeric(12,2)`). `currency` is `"INR"` today. |
| nullable | any field documented `| null` can genuinely be `null` — guard before rendering |
| `specs` | object; `{}` (empty) for products whose detail pass hasn't run |

Format INR with `new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })`.

---

## 3. Types

```ts
type ProductSummary = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
};

type Product = ProductSummary & {
  sku: string | null;
  description: string | null;
  specs: Record<string, string | number>;   // up to 9 keys; {} until detail pass
  first_seen_at: string;
  last_seen_at: string | null;
  updated_at: string;
};

type PricePoint = {
  id: string;                 // uuid
  product_id: number;
  price: number;
  mrp: number;
  sale: number | null;
  badge_pct: number | null;
  stock: number | null;       // raw count; 0 or null => out of stock
  currency: string;           // "INR"
  rating: number | null;
  rating_count: number | null;
  seller: string | null;
  delivery_days: number | null;
  variant: string | null;     // "triple" | "stale" | "malformed" | null
  format: string | null;
  pending: boolean | null;
  triple: boolean | null;
  quoted_at: string;          // when the STORE said so
  scraped_at: string;         // when WE captured it
};

type Alert = {
  id: string;                 // uuid
  product_id: number;
  type: "price_drop" | "back_in_stock";
  threshold: number | null;   // reserved, currently always null
  triggered_at: string | null;// null = never fired
  is_active: boolean;
  notified_via: "in_app" | "email" | "both";
};

type ScrapeLogRow = {
  id: string;
  product_id: number;
  attempted_at: string;
  status: "success" | "failed" | "structure_error";
  retry_count: number;
  error_message: string | null;
  duration_ms: number | null;
  price_history_id: string | null;  // set only when status === "success"
};

type TrackedProduct = {
  id: string;
  product_id: number;
  scrape_frequency_minutes: number;
  next_scrape_at: string;
  last_scraped_at: string | null;
  is_active: boolean;
  created_at: string;
};

type DashboardRow = {
  tracked_id: string;
  product_id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  is_active: boolean;
  scrape_frequency_minutes: number;
  next_scrape_at: string;
  last_scraped_at: string | null;
  // latest price — all null if the product has never been scraped
  price: number | null;
  mrp: number | null;
  sale: number | null;
  badge_pct: number | null;
  stock: number | null;
  currency: string | null;
  quoted_at: string | null;
  // latest scrape health
  last_scrape_status: "success" | "failed" | "structure_error" | null;
  last_scrape_attempted_at: string | null;
  last_scrape_error: string | null;
};
```

---

## 4. Public endpoints

### `GET /` — health

```json
{ "message": "PricePulse API" }
```

---

### `GET /products` — full catalog

No inputs. Returns **every** product row, including `specs`.

```json
[
  {
    "id": 1,
    "slug": "nordkraft-headphones-pro",
    "name": "Nordkraft Headphones Pro",
    "brand": "Nordkraft",
    "category": "Audio",
    "sku": "NOR-10001",
    "description": "The Nordkraft Headphones Pro. A dependable audio pick…",
    "specs": { "colour": "Olive", "modelYear": 2023, "weightGrams": 1353, "...": "..." },
    "first_seen_at": "2026-09-19T10:42:43.309904+00:00",
    "last_seen_at": "2026-09-19T10:43:59.218+00:00",
    "updated_at": "2026-09-19T10:43:59.218+00:00"
  }
]
```

> **Perf warning:** this is ~762 rows *with* `specs` — a payload in the hundreds of KB. Fine for a
> one-off "load the catalog" step, wrong for a list or a keystroke handler. **Use
> `/products/search` for anything in a list.** Returns `[]` only if the table is empty.

---

### `GET /products/search?q=` — name search

| param | required | notes |
|---|---|---|
| `q` | **yes** | substring match on `name`, case-insensitive (`ILIKE %q%`) |
| `limit` | no | default **20**, max **100** |

Returns `ProductSummary[]` — **no `specs`, no `description`** (deliberately light).

```json
[
  { "id": 24, "slug": "amperage-dive-watch-pro", "name": "Amperage Dive Watch Pro",
    "brand": "Amperage", "category": "Wearables" },
  { "id": 584, "slug": "amperage-dive-watch-three", "name": "Amperage Dive Watch Three",
    "brand": "Amperage", "category": "Wearables" }
]
```

| status | body |
|---|---|
| 200 | array (possibly empty) |
| 400 | `{ "error": "Missing required query param: q" }` |

Search is **name-only**. There is no brand/category filter today.

---

### `GET /products/:id` — product detail

`Product` (see §3). Includes the full `specs` object.

| status | body |
|---|---|
| 200 | `Product` |
| 400 | `{ "error": "Invalid product id" }` (non-integer or `<= 0`) |
| 404 | `{ "error": "Product not found" }` |

```json
{
  "id": 1,
  "slug": "nordkraft-headphones-pro",
  "name": "Nordkraft Headphones Pro",
  "brand": "Nordkraft",
  "category": "Audio",
  "sku": "NOR-10001",
  "description": "The Nordkraft Headphones Pro. A dependable audio pick…",
  "specs": {
    "colour": "Olive",
    "returns": "15-day replacement, unopened",
    "support": "Phone and email, 10am–6pm IST, Mon–Sat",
    "inTheBox": "Headphones, Cable clip, Carry pouch, USB-C charging cable, Spare pads",
    "material": "Recycled aluminium",
    "warranty": "18 months manufacturer warranty",
    "modelYear": 2023,
    "weightGrams": 1353,
    "countryOfOrigin": "Mexico"
  },
  "first_seen_at": "2026-09-19T10:42:43.309904+00:00",
  "last_seen_at": "2026-09-19T10:43:59.218+00:00",
  "updated_at": "2026-09-19T10:43:59.218+00:00"
}
```

> `specs` is `{}` for products whose detail pass hasn't run (most of them). Render "no specs"
> rather than looping over nothing. The 9 known keys are listed above; `modelYear` and
> `weightGrams` are numbers, the rest strings.

---

### `GET /products/:id/price-history` — the chart series

No inputs. Returns **all** price points for the product, **oldest first** (`quoted_at` ascending —
chart-ready, no client-side sort).

```json
[
  {
    "id": "b30ac1f1-d0cf-4dfd-afd5-c1c10888566f",
    "product_id": 1,
    "price": 8809,
    "mrp": 10832,
    "sale": null,
    "badge_pct": 29,
    "stock": 40,
    "currency": "INR",
    "rating": 4.6,
    "rating_count": 45243,
    "seller": "Vantage Outlet",
    "delivery_days": 7,
    "variant": "stale",
    "format": null,
    "pending": true,
    "triple": false,
    "quoted_at": "2026-09-19T12:31:11.751+00:00",
    "scraped_at": "2026-09-19T12:31:11.79+00:00"
  }
]
```

| status | body |
|---|---|
| 200 | array — `[]` means never scraped (normal for untracked products) |
| 400 | `{ "error": "Invalid product id" }` |

> **Plot `quoted_at`, not `scraped_at`.** `quoted_at` is the store's own timestamp; `scraped_at`
> is when we happened to hit it. Gaps in the series are real — the scheduler drops missed
> intervals rather than replaying them (`session4.md` §3).

---

### `GET /alerts?productId=` — alert rules

| param | required | notes |
|---|---|---|
| `productId` | **yes** | integer |

Returns **only active** alerts (`is_active = true`). Disabled/triggered rules are not returned.

```json
[
  {
    "id": "65568c97-9581-45c7-b317-0aec77df8bf3",
    "product_id": 1,
    "type": "back_in_stock",
    "threshold": null,
    "triggered_at": null,
    "is_active": true,
    "notified_via": "in_app"
  }
]
```

| status | body |
|---|---|
| 200 | array (possibly empty) |
| 400 | `{ "error": "Missing or invalid query param: productId" }` |

> **Empty is normal.** Alerts are only created when a product is tracked. A never-tracked product
> returns `[]`. To show alert *history*, you'd need a new endpoint — `triggered_at` is set and
> `is_active` flipped to `false` once fired, and those rows are invisible here.

---

### `GET /dashboard` — the main screen

No inputs. One row per tracked product (active **and** paused), joined with its latest price and
latest scrape outcome.

```json
[
  {
    "tracked_id": "3d5b99c2-e7d4-4aaf-88a6-d8cfac18b11e",
    "product_id": 1,
    "slug": "nordkraft-headphones-pro",
    "name": "Nordkraft Headphones Pro",
    "brand": "Nordkraft",
    "category": "Audio",
    "is_active": true,
    "scrape_frequency_minutes": 60,
    "next_scrape_at": "2026-09-19T12:31:24.467+00:00",
    "last_scraped_at": "2026-09-19T12:31:11.98+00:00",
    "price": 8809,
    "mrp": 10832,
    "sale": null,
    "badge_pct": 29,
    "stock": 40,
    "currency": "INR",
    "quoted_at": "2026-09-19T12:31:11.751+00:00",
    "last_scrape_status": "success",
    "last_scrape_attempted_at": "2026-09-19T12:31:11.859+00:00",
    "last_scrape_error": null
  }
]
```

`[]` when nothing is tracked. `last_scrape_status` drives a health badge: `"success"` green,
`"failed"` / `"structure_error"` red, `null` grey (never scraped). Price fields are `null` until
the first successful scrape.

> ⚠️ **This endpoint 500s until the `dashboard` view is applied to the database.** See
> `Session5.md` §5. Until then: `{"error":"Could not find the table 'public.dashboard' in the
> schema cache"}`.

---

## 5. Admin endpoints

All require the secret — and per the warning at the top, **these should not be called from
browser code.**

Header (either form works):

```
x-admin-secret: <ADMIN_SECRET>
Authorization: Bearer <ADMIN_SECRET>
```

Failure modes:

| status | body | cause |
|---|---|---|
| 401 | `{ "error": "Invalid or missing admin secret" }` | missing or wrong secret |
| 503 | `{ "error": "Admin API disabled: ADMIN_SECRET is not set" }` | server has no secret configured |

---

### `GET /scrape-logs` — audit trail

| param | required | notes |
|---|---|---|
| `limit` | no | default **200**, max **1000** |
| `productId` | no | filter to one product |

Newest first. Unbounded reads are capped deliberately — the table grows one row per scrape cycle.

```json
[
  {
    "id": "928c89a6-0424-4aa6-b908-51e705976ba7",
    "product_id": 1,
    "attempted_at": "2026-09-19T12:31:11.859+00:00",
    "status": "success",
    "retry_count": 0,
    "error_message": null,
    "duration_ms": 458,
    "price_history_id": "b30ac1f1-d0cf-4dfd-afd5-c1c10888566f"
  }
]
```

| status | body |
|---|---|
| 200 | array |
| 400 | `{ "error": "Invalid productId" }` |

`price_history_id` is non-null **only** when `status === "success"` — that's the invariant linking
a successful cycle to the price row it wrote.

---

### `POST /scheduler/run` — trigger a scrape pass

No body. Scrapes every **due, active** tracked product sequentially against the live store.

```json
{
  "claimed": 1,
  "succeeded": 1,
  "failed": 0,
  "structureError": 0,
  "alertsFired": 0,
  "details": [
    { "productId": 1, "status": "success", "price": 8809, "alertsFired": 0 }
  ]
}
```

`details[]` entries are `{ productId, status, price, alertsFired }` on success and
`{ productId, status, error }` on failure. `status` is `"success" | "failed" | "structure_error"`.

- `claimed: 0` is the normal case — nothing is due. Not an error.
- `structureError > 0` means the store changed its payload shape (needs a code fix, not a retry).
- Reschedules each product: success → `now + frequency`, failure → `now + 15 min`.

---

### `POST /track` — start tracking

Body:

```json
{ "productId": 1, "frequencyMinutes": 60 }
```

| field | required | notes |
|---|---|---|
| `productId` | **yes** | positive integer |
| `frequencyMinutes` | no | positive integer; default **120** |

Also creates the two default alert rules (`price_drop`, `back_in_stock`) if missing. Re-tracking
is idempotent (upsert on `product_id`) and **reactivates** a paused product.

```json
{
  "tracked": {
    "id": "3d5b99c2-e7d4-4aaf-88a6-d8cfac18b11e",
    "product_id": 1,
    "scrape_frequency_minutes": 60,
    "next_scrape_at": "2026-09-19T14:19:11.716+00:00",
    "last_scraped_at": "2026-09-19T12:31:11.98+00:00",
    "is_active": true,
    "created_at": "2026-09-19T12:31:10.64768+00:00"
  },
  "alertsCreated": 0
}
```

| status | body |
|---|---|
| 201 | `{ tracked, alertsCreated }` |
| 400 | `{ "error": "Body must include an integer productId" }` / `{ "error": "frequencyMinutes must be a positive integer" }` |
| 404 | `{ "error": "Product not found" }` |

`alertsCreated` is `2` on first track, `0` afterwards. A tracked product is immediately due
(`next_scrape_at = now`), so the next scheduler pass scrapes it.

---

### `DELETE /track/:id` — pause tracking

`:id` is the **`product_id`** (integer) — the same id you passed to `/track`, *not* the
`tracked_products.id` uuid.

Sets `is_active = false`. **Nothing is deleted** — price history and scrapes stay, the product
just stops being scheduled. The dashboard still shows it, with `is_active: false`.

```json
{
  "id": "3d5b99c2-e7d4-4aaf-88a6-d8cfac18b11e",
  "product_id": 1,
  "scrape_frequency_minutes": 60,
  "next_scrape_at": "2026-09-19T14:19:11.716+00:00",
  "last_scraped_at": "2026-09-19T12:31:11.98+00:00",
  "is_active": false,
  "created_at": "2026-09-19T12:31:10.64768+00:00"
}
```

| status | body |
|---|---|
| 200 | `TrackedProduct` |
| 400 | `{ "error": "Invalid product id" }` |
| 404 | `{ "error": "Not tracking that product" }` |

To resume: `POST /track` again.

---

### `POST /alerts` — ensure the default alert rules

Body: `{ "productId": 1 }` (`productId` required, positive integer).

Inserts whichever of `price_drop` / `back_in_stock` don't exist yet.

```json
{ "created": 0 }
```

| status | body |
|---|---|
| 201 | `{ "created": number }` — `0` means both already exist |
| 400 | `{ "error": "Body must include an integer productId" }` |

> ⚠️ **`created: 0` does not mean the alerts are armed.** This only checks whether a rule of that
> `type` *exists*, not whether `is_active` is true. A disabled alert stays disabled and the
> response is still `{ "created": 0 }`. **There is currently no endpoint to re-enable a disabled
> alert** — that's an open gap (see `Session5.md`).

---

### `DELETE /alerts/:id` — disable an alert

`:id` is the alert **uuid** (from `GET /alerts`).

Sets `is_active = false`. Like untracking, this is **not a delete** — the row survives, so it's
idempotent: calling it twice returns the same row twice.

```json
{
  "id": "65568c97-9581-45c7-b317-0aec77df8bf3",
  "product_id": 1,
  "type": "price_drop",
  "threshold": null,
  "triggered_at": null,
  "is_active": false,
  "notified_via": "in_app"
}
```

| status | body |
|---|---|
| 200 | `Alert` |
| 400 | `{ "error": "Invalid alert id" }` (not a uuid) |
| 404 | `{ "error": "Alert not found" }` |

---

## 6. Errors

Every error is `{ "error": "<message>" }`. There is **no error code field** — switch on the HTTP
status, not the message text.

| status | meaning |
|---|---|
| 200 | ok |
| 201 | created (POST `/track`, POST `/alerts`) |
| 400 | bad input — a validation message in `error` |
| 401 | admin secret missing/wrong |
| 404 | resource doesn't exist |
| 500 | server/DB error — `error` is the raw Postgres/PostgREST message |
| 503 | admin API disabled — `ADMIN_SECRET` unset on the server |

`500` messages are raw and not stable; log them, don't match on them.

---

## 7. Screen → calls

| screen | calls |
|---|---|
| Catalog / search | `GET /products/search?q=<input>&limit=20` |
| Product detail | `GET /products/:id`, `GET /products/:id/price-history`, `GET /alerts?productId=:id` |
| Dashboard | `GET /dashboard` (one call, everything on the card) |
| Price chart | `GET /products/:id/price-history` → plot `price` over `quoted_at` |
| Ops / debug | `GET /scrape-logs?productId=&limit=` (admin) |
| "Track this" button | needs admin — **proxy through the backend, not the browser** |

## 8. Polling / freshness

Nothing is pushed. The scheduler is driven by an external cron hitting `POST /scheduler/run`
every few minutes, and a scrape only happens when a product is due. Practical polling: refresh
`GET /dashboard` on an interval of **a minute or more** — polling faster than the cron interval
just returns the same rows.

`next_scrape_at` tells you when a given product is next due; it's a hint, not a promise — the
actual scrape only happens on the next cron ping after that time (`session4.md`).
