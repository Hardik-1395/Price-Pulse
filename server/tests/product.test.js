import { afterEach, describe, expect, it } from "bun:test";
import {
    ProductNotFoundError,
    ProductSchema,
    ProductSpecsSchema,
    ProductStructureError,
    ReviewSchema,
    fetchProduct,
} from "../src/lib/Scaper/product.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// Schema tests (pure — no network)
// ---------------------------------------------------------------------------

describe("ProductSpecsSchema", () => {
    it("accepts string and number values in any combination", () => {
        const parsed = ProductSpecsSchema.parse({
            color: "red",
            weightGrams: 320,
            material: "steel",
            batteryMah: 5000,
        });
        expect(parsed.color).toBe("red");
        expect(parsed.weightGrams).toBe(320);
    });

    it("rejects values that are not strings or numbers", () => {
        expect(() => ProductSpecsSchema.parse({ nested: { obj: true } })).toThrow();
        expect(() => ProductSpecsSchema.parse({ arr: [1, 2] })).toThrow();
    });
});

describe("ReviewSchema", () => {
    it("validates a well-formed review", () => {
        const r = ReviewSchema.parse({
            id: "rev-001",
            author: "Alice",
            rating: 4.5,
            title: "Great product",
            body: "Really liked it.",
            date: "2024-01-15",
            verifiedPurchase: true,
            helpfulVotes: 12,
        });
        expect(r.id).toBe("rev-001");
        expect(r.verifiedPurchase).toBe(true);
    });

    it("rejects a review missing required fields", () => {
        expect(() => ReviewSchema.parse({ id: "x", author: "Bob" })).toThrow();
    });
});

describe("ProductSchema", () => {
    const base = {
        id: 42,
        slug: "test-product",
        name: "Test Product",
        brand: "Acme",
        category: "Tools",
        sku: "ACM-42",
        description: "A fine tool.",
        specs: { weightGrams: 100, color: "black" },
        reviews: [],
    };

    it("validates a complete product with no reviews", () => {
        const parsed = ProductSchema.parse(base);
        expect(parsed.id).toBe(42);
        expect(parsed.reviews).toHaveLength(0);
    });

    it("requires id to be a positive integer", () => {
        expect(() => ProductSchema.parse({ ...base, id: 0 })).toThrow();
        expect(() => ProductSchema.parse({ ...base, id: -1 })).toThrow();
        expect(() => ProductSchema.parse({ ...base, id: "42" })).toThrow();
    });

    it("requires name and slug to be non-empty strings", () => {
        expect(() => ProductSchema.parse({ ...base, name: "" })).toThrow();
        expect(() => ProductSchema.parse({ ...base, slug: "" })).toThrow();
    });
});

// ---------------------------------------------------------------------------
// Error class tests (pure)
// ---------------------------------------------------------------------------

describe("ProductStructureError", () => {
    it("is an instance of Error with the correct name", () => {
        const err = new ProductStructureError("bad payload");
        expect(err instanceof Error).toBe(true);
        expect(err instanceof ProductStructureError).toBe(true);
        expect(err.name).toBe("ProductStructureError");
        expect(err.message).toBe("bad payload");
    });
});

describe("ProductNotFoundError", () => {
    it("is an instance of Error with the correct name", () => {
        const err = new ProductNotFoundError("product 999 not found");
        expect(err instanceof Error).toBe(true);
        expect(err instanceof ProductNotFoundError).toBe(true);
        expect(err.name).toBe("ProductNotFoundError");
    });
});

// ---------------------------------------------------------------------------
// fetchProduct — argument validation (no network)
// ---------------------------------------------------------------------------

describe("fetchProduct argument validation", () => {
    it("throws synchronously for non-integer or sub-1 product ids", async () => {
        await expect(fetchProduct(0)).rejects.toThrow("Invalid product id: 0");
        await expect(fetchProduct(-1)).rejects.toThrow("Invalid product id: -1");
        await expect(fetchProduct(1.5)).rejects.toThrow("Invalid product id: 1.5");
        await expect(fetchProduct("5")).rejects.toThrow("Invalid product id: 5");
    });
});

// ---------------------------------------------------------------------------
// fetchProduct — network and parsing (mocked fetch)
// ---------------------------------------------------------------------------

function makeProduct(overrides = {}) {
    return {
        id: 42,
        slug: "test-product",
        name: "Test Product",
        brand: "Acme",
        category: "Tools",
        sku: "ACM-42",
        description: "Desc",
        specs: { color: "black" },
        reviews: [],
        ...overrides,
    };
}

describe("fetchProduct network and parsing", () => {
    it("fetches and returns a parsed product on success", async () => {
        const payload = makeProduct();
        globalThis.fetch = async () =>
            new Response(JSON.stringify(payload), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        const result = await fetchProduct(42, { baseUrl: "https://example.com" });
        expect(result.id).toBe(42);
        expect(result.name).toBe("Test Product");
        expect(result.specs.color).toBe("black");
    });

    it("throws ProductNotFoundError on HTTP 404 and does not retry", async () => {
        let calls = 0;
        globalThis.fetch = async () => {
            calls++;
            return new Response("Not Found", { status: 404 });
        };

        await expect(fetchProduct(999, { baseUrl: "https://example.com", retries: 3 })).rejects.toThrow(
            ProductNotFoundError,
        );
        // 404 is not retried — should be exactly 1 call
        expect(calls).toBe(1);
    });

    it("throws ProductStructureError when response is invalid JSON", async () => {
        globalThis.fetch = async () =>
            new Response("not json at all", { status: 200 });

        await expect(fetchProduct(1, { baseUrl: "https://example.com", retries: 0 })).rejects.toThrow(
            ProductStructureError,
        );
    });

    it("throws ProductStructureError when response fails Zod schema", async () => {
        globalThis.fetch = async () =>
            new Response(JSON.stringify({ unexpected: true }), { status: 200 });

        await expect(fetchProduct(1, { baseUrl: "https://example.com", retries: 0 })).rejects.toThrow(
            ProductStructureError,
        );
    });

    it("retries on retryable HTTP status and succeeds on the second attempt", async () => {
        let attempts = 0;
        const payload = makeProduct();

        globalThis.fetch = async () => {
            attempts++;
            if (attempts === 1) return new Response("Service Unavailable", { status: 503 });
            return new Response(JSON.stringify(payload), { status: 200 });
        };

        const result = await fetchProduct(42, { baseUrl: "https://example.com", retries: 2 });
        expect(attempts).toBe(2);
        expect(result.id).toBe(42);
    });

    it("throws a plain Error for non-retryable non-ok non-404 responses", async () => {
        globalThis.fetch = async () =>
            new Response("Forbidden", { status: 403 });

        const err = await fetchProduct(42, { baseUrl: "https://example.com", retries: 0 }).catch(
            (e) => e,
        );
        // Not a ProductNotFoundError and not a ProductStructureError
        expect(err instanceof ProductNotFoundError).toBe(false);
        expect(err instanceof ProductStructureError).toBe(false);
        expect(err.message).toContain("403");
    });

    it("uses /api/product/{id} endpoint (singular 'product')", async () => {
        let capturedUrl = "";
        globalThis.fetch = async (url) => {
            capturedUrl = url.toString();
            return new Response(JSON.stringify(makeProduct({ id: 7 })), { status: 200 });
        };

        await fetchProduct(7, { baseUrl: "https://example.com" });
        expect(capturedUrl).toBe("https://example.com/api/product/7");
    });
});
