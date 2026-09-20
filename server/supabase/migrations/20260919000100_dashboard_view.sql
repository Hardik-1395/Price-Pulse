-- Dashboard read model: one row per tracked product with the product identity plus its most
-- recent price snapshot and most recent scrape outcome. The lateral joins do the "latest row per
-- product" in Postgres, so the API doesn't N+1 or ship the whole price/scrape history.
create or replace view dashboard as
select
    tp.id                       as tracked_id,
    tp.product_id,
    p.slug,
    p.name,
    p.brand,
    p.category,
    tp.is_active,
    tp.scrape_frequency_minutes,
    tp.next_scrape_at,
    tp.last_scraped_at,
    ph.price,
    ph.mrp,
    ph.sale,
    ph.badge_pct,
    ph.stock,
    ph.currency,
    ph.quoted_at,
    sl.status                   as last_scrape_status,
    sl.created_at               as last_scrape_attempted_at,
    sl.error_message            as last_scrape_error
from tracked_products tp
join products p
    on p.id = tp.product_id
left join lateral (
    select *
    from price_history
    where product_id = tp.product_id
    order by quoted_at desc
    limit 1
) ph on true
left join lateral (
    select *
    from scrape_log
    where product_id = tp.product_id
    order by created_at desc
    limit 1
) sl on true;
