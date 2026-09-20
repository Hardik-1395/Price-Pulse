#!/usr/bin/env bun
/**
 * Populate the `products` table from the store.
 *
 *   bun scripts/fill-catalog.js [--max-catalog=40] [--max-product=100] [--delay=150] [--js…]
 *
 * Pass 1 draws catalog pages (cheap identity), pass 2 backfills the dense-id gaps via
 * /api/product/{id}. Both write to Supabase using the service role from .env.
 */
import { fillCatalog } from "../src/lib/Scaper/fill.js";

const flags = {};
for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    flags[key] = value ?? true;
}

const num = (value, fallback) => (value === undefined ? fallback : Number(value));
const clock = () => performance.now();
const secs = (start) => `${((clock() - start) / 1000).toFixed(1)}s`;

const start = clock();

try {
    const result = await fillCatalog({
        maxCatalogRequests: num(flags["max-catalog"], 40),
        maxProductRequests: num(flags["max-product"], 100),
        delayMs: num(flags.delay, 150),
        onProgress: (progress) => {
            if (progress.phase === "identity") {
                console.log(
                    `  [${secs(start)}] identity  requests=${progress.requests}` +
                        `  sampled=${progress.sampled}/${progress.total ?? "?"}  written=${progress.written}`,
                );
                return;
            }
            if (progress.requests % 25 !== 0) return;
            console.log(
                `  [${secs(start)}] backfill  id=${progress.id}  requests=${progress.requests}` +
                    `  remaining=${progress.remaining}  filled=${progress.filled}` +
                    `  failed=${progress.failures}`,
            );
        },
    });

    console.log(
        `\n  total=${result.total}  sampled=${result.sampled}  gaps=${result.gaps}` +
            `  identity_written=${result.identityWritten}  backfilled=${result.backfilled}` +
            `\n  requests=${result.catalogRequests + result.productRequests}` +
            `  failures=${result.failures.length}  complete=${result.complete}` +
            `  nextCursor=${result.nextCursor}  in ${secs(start)}`,
    );

    if (flags.json) console.log(JSON.stringify(result, null, 2));
} catch (error) {
    console.error(`\nFILL FAILED: ${error.name}: ${error.message}`);
    process.exitCode = 1;
}
