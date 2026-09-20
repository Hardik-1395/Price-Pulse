import { fetchPrice, PriceStructureError } from "../Scaper/price.js";
import { listDue, markFailure, markSuccess } from "../Models/trackedProducts.js";
import { insert as insertPriceHistory, latest as latestPrice } from "../Models/priceHistory.js";
import { insert as insertScrapeLog } from "../Models/scrapeLog.js";
import { listActive, markTriggered } from "../Models/alerts.js";


const RETRY_DELAY_MINUTES = 15;

function mapQuote(productId, quote) {
    return {
        product_id: productId,
        price: quote.price,
        mrp: quote.mrp,
        sale: quote.sale,
        badge_pct: quote.badgePct,
        stock: quote.stock,
        currency: quote.currency,
        rating: quote.rating,
        rating_count: quote.ratingCount,
        seller: quote.seller,
        delivery_days: quote.deliveryDays,
        variant: quote.variant,
        format: quote.format,
        pending: quote.pending,
        triple: quote.triple,
        quoted_at: new Date(quote.at).toISOString(),
        scraped_at: new Date().toISOString(),
    };
}


async function evaluateAlerts(productId, prev, quote) {
    const alerts = await listActive(productId);
    let fired = 0;

    for (const alert of alerts) {
        let fire = false;

        if (alert.type === "price_drop") {
            fire = Boolean(prev) && quote.price < Number(prev.price);
        } else if (alert.type === "back_in_stock") {
            fire = Boolean(prev) && (prev.stock == null || prev.stock === 0) && quote.stock > 0;
        }

        if (fire) {
            await markTriggered(alert.id);
            fired++;
        }
    }

    return fired;
}


export async function runDueScrapes() {
    const due = await listDue();
    const summary = {
        claimed: due.length,
        succeeded: 0,
        failed: 0,
        structureError: 0,
        alertsFired: 0,
        details: [],
    };

    for (const tracked of due) {
        const started = performance.now();

        try {
            const prev = await latestPrice(tracked.product_id);
            const quote = await fetchPrice(tracked.product_id);
            const durationMs = Math.round(performance.now() - started);

            const priceRow = await insertPriceHistory(mapQuote(tracked.product_id, quote));
            await insertScrapeLog({
                product_id: tracked.product_id,
                attempted_at: new Date().toISOString(),
                status: "success",
                retry_count: 0,
                duration_ms: durationMs,
                price_history_id: priceRow.id,
            });

            const fired = await evaluateAlerts(tracked.product_id, prev, quote);
            await markSuccess(tracked.id, tracked.scrape_frequency_minutes);

            summary.succeeded++;
            summary.alertsFired += fired;
            summary.details.push({
                productId: tracked.product_id,
                status: "success",
                price: quote.price,
                alertsFired: fired,
            });
        } catch (error) {
            const durationMs = Math.round(performance.now() - started);
            const status = error instanceof PriceStructureError ? "structure_error" : "failed";

            await insertScrapeLog({
                product_id: tracked.product_id,
                attempted_at: new Date().toISOString(),
                status,
                retry_count: 0,
                error_message: error.message,
                duration_ms: durationMs,
            });
            await markFailure(tracked.id, RETRY_DELAY_MINUTES);

            if (status === "structure_error") summary.structureError++;
            else summary.failed++;
            summary.details.push({ productId: tracked.product_id, status, error: error.message });
        }
    }

    return summary;
}

export default runDueScrapes;
