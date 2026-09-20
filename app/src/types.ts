export type ProductSummary = {
  id: number;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
};

export type Product = ProductSummary & {
  sku: string | null;
  description: string | null;
  specs: Record<string, string | number>;   // up to 9 keys; {} until detail pass
  first_seen_at: string;
  last_seen_at: string | null;
  updated_at: string;
};

export type PricePoint = {
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

export type Alert = {
  id: string;                 // uuid
  product_id: number;
  type: "price_drop" | "back_in_stock";
  threshold: number | null;   // reserved, currently always null
  triggered_at: string | null;// null = never fired
  is_active: boolean;
  notified_via: "in_app" | "email" | "both";
};

export type ScrapeLogRow = {
  id: string;
  product_id: number;
  attempted_at: string;
  status: "success" | "failed" | "structure_error";
  retry_count: number;
  error_message: string | null;
  duration_ms: number | null;
  price_history_id: string | null;  // set only when status === "success"
};

export type TrackedProduct = {
  id: string;
  product_id: number;
  scrape_frequency_minutes: number;
  next_scrape_at: string;
  last_scraped_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type DashboardRow = {
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
