import pRetry, { AbortError } from "p-retry";
import { z } from "zod";
import {
    DEFAULT_BASE_URL,
    DEFAULT_TIMEOUT,
    PRODUCT_RETRIES,
    RETRYABLE_STATUS,
    USER_AGENT,
} from "./constants.js";

// The specs object has a consistent set of keys across all products, but the values can be
// strings or numbers depending on the field — the schema stays loose to accommodate both.
export const ProductSpecsSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export const ReviewSchema = z.object({
    id: z.string().min(1),
    author: z.string(),
    rating: z.number(),
    title: z.string(),
    body: z.string(),
    date: z.string(),
    verifiedPurchase: z.boolean(),
    helpfulVotes: z.number(),
});

export const ProductSchema = z.object({
    id: z.number().int().positive(),
    slug: z.string().min(1),
    name: z.string().min(1),
    brand: z.string(),
    category: z.string(),
    sku: z.string(),
    description: z.string(),
    specs: ProductSpecsSchema,
    reviews: z.array(ReviewSchema),
});

// Thrown when the product endpoint returns a structurally unexpected payload (schema mismatch).
// Distinct from transient transport errors — this needs a code fix, not a retry.
export class ProductStructureError extends Error {
    constructor(message) {
        super(message);
        this.name = "ProductStructureError";
    }
}

// Thrown when the product endpoint responds with HTTP 404.
// A 404 in this store's dense integer-keyed catalog is a definitive answer ("does not exist"),
// not a transient failure, so callers must never retry it.
export class ProductNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "ProductNotFoundError";
    }
}

// Build the store's standard request headers, merged with any caller-supplied overrides.
function buildHeaders(extra = {}) {
    return {
        "user-agent": USER_AGENT,
        accept: "application/json",
        ...extra,
    };
}

// Combine an optional caller-provided AbortSignal with a per-request timeout.
// If the caller signal fires first, the request is aborted early; otherwise the timeout wins.
function buildSignal(timeout, callerSignal) {
    return callerSignal
        ? AbortSignal.any([callerSignal, AbortSignal.timeout(timeout)])
        : AbortSignal.timeout(timeout);
}

// Execute a single HTTP fetch to the product endpoint with retry on transient errors.
// Returns { status, ok, text } — parsing and semantics live outside this function so that
// a schema-change error never gets misclassified as a transport failure and retried.
async function fetchProductRaw(url, { retries, timeout, headers, signal }) {
    return pRetry(
        async () => {
            const res = await fetch(url, {
                redirect: "follow",
                headers: buildHeaders(headers),
                signal: buildSignal(timeout, signal),
            });

            // Retryable statuses (429, 503, etc.) throw so p-retry can back off and try again.
            if (RETRYABLE_STATUS.has(res.status))
                throw new Error(`Retryable HTTP ${res.status} for ${url.href}`);

            // Any other response (200, 404, etc.) is returned as-is — the caller decides what
            // it means. A 404 is not retried here; it becomes ProductNotFoundError below.
            return { status: res.status, ok: res.ok, text: await res.text() };
        },
        {
            retries,
            signal,
            onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
                console.warn(
                    `[product] ${url.href} attempt ${attemptNumber} failed: ${error.message} (${retriesLeft} left)`,
                );
            },
        },
    );
}

// Validate and parse the raw response text into a typed Product object.
// Throws ProductStructureError if the payload does not match the schema.
function parseProductPayload(rawText, url) {
    try {
        return ProductSchema.parse(JSON.parse(rawText));
    } catch (error) {
        throw new ProductStructureError(
            `Unexpected product payload from ${url.pathname}: ${error.message}`,
        );
    }
}

export async function fetchProduct(productId, options = {}) {
    const {
        baseUrl = process.env.STORE_BASE_URL ?? DEFAULT_BASE_URL,
        timeout = DEFAULT_TIMEOUT,
        retries = PRODUCT_RETRIES,
        headers = {},
        signal,
    } = options;

    if (!Number.isInteger(productId) || productId < 1)
        throw new Error(`Invalid product id: ${productId}`);

    const url = new URL(`/api/product/${productId}`, baseUrl);

    const raw = await fetchProductRaw(url, { retries, timeout, headers, signal });

    if (raw.status === 404)
        throw new ProductNotFoundError(`No product ${productId} (HTTP 404 from ${url.pathname})`);

    if (!raw.ok)
        throw new Error(`HTTP ${raw.status} for ${url.pathname}`);

    return parseProductPayload(raw.text, url);
}

export default fetchProduct;
