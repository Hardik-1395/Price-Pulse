create extension if not exists pg_trgm;

create table products (
    id            bigint primary key,
    slug          text not null,
    name          text not null,
    brand         text,
    category      text,
    sku           text,
    description   text,
    specs         jsonb not null default '{}'::jsonb,
    first_seen_at timestamptz not null default now(),
    last_seen_at  timestamptz,
    updated_at    timestamptz not null default now()
);

create index products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index products_brand_idx on products (brand);
create index products_category_idx on products (category);


create table reviews (
    id                uuid primary key default gen_random_uuid(),
    product_id        bigint not null references products (id) on delete cascade,
    source_id         text not null,
    author            text not null,
    rating            numeric(2, 1) not null,
    title             text,
    body              text,
    review_date       text,
    verified_purchase boolean not null,
    helpful_votes     integer not null,
    scraped_at        timestamptz not null default now(),
    unique (product_id, source_id)
);


create table price_history (
    id            uuid primary key default gen_random_uuid(),
    product_id    bigint not null references products (id) on delete cascade,
    price         numeric(12, 2) not null,
    mrp           numeric(12, 2) not null,
    sale          numeric(12, 2),
    badge_pct     integer,
    stock         integer,
    currency      text not null default 'INR',
    rating        numeric(2, 1),
    rating_count  integer,
    seller        text,
    delivery_days integer,
    variant       text,
    format        text,
    pending       boolean,
    triple        boolean,
    quoted_at     timestamptz not null,
    scraped_at    timestamptz not null default now()
);

create index price_history_product_quoted_idx
    on price_history (product_id, quoted_at desc);

create table tracked_products (
    id                       uuid primary key default gen_random_uuid(),
    product_id               bigint not null unique references products (id) on delete cascade,
    scrape_frequency_minutes integer not null default 120,
    next_scrape_at           timestamptz not null,
    last_scraped_at          timestamptz,
    is_active                boolean not null default true,
    created_at               timestamptz not null default now()
);


create index tracked_products_due_idx
    on tracked_products (next_scrape_at) where is_active;


create table scrape_log (
    id               uuid primary key default gen_random_uuid(),
    product_id       bigint not null references products (id) on delete cascade,
    attempted_at     timestamptz not null default now(),
    status           text not null check (status in ('success', 'failed', 'structure_error')),
    retry_count      integer not null default 0,
    error_message    text,
    duration_ms      integer,
    price_history_id uuid references price_history (id) on delete set null
);

create index scrape_log_product_attempted_idx
    on scrape_log (product_id, attempted_at desc);


create table alerts (
    id           uuid primary key default gen_random_uuid(),
    product_id   bigint not null references products (id) on delete cascade,
    type         text not null check (type in ('price_drop', 'back_in_stock')),
    threshold    numeric(12, 2),
    triggered_at timestamptz,
    is_active    boolean not null default true,
    notified_via text not null check (notified_via in ('in_app', 'email', 'both'))
);

create index alerts_product_type_idx on alerts (product_id, type);


alter table products enable row level security;
alter table reviews enable row level security;
alter table price_history enable row level security;
alter table tracked_products enable row level security;
alter table scrape_log enable row level security;
alter table alerts enable row level security;
