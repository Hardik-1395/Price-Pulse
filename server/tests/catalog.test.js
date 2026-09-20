import { afterEach, describe, expect, it } from "bun:test";
import {
    CatalogPageSchema,
    CatalogProductSchema,
    CatalogStructureError,
    catalogUrl,
    collectProducts,
    fetchCatalogPage,
} from "../src/lib/Scaper/catalog.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

describe("catalogUrl", () => {
    it("constructs url with default clamped pageSize", () => {
        const url = catalogUrl("https://demo.inelabteamdev.com", 1, 20);
        expect(url.pathname).toBe("/api/catalog");
        expect(url.searchParams.get("page")).toBe("1");
        expect(url.searchParams.get("pageSize")).toBe("20");
    });

    it("clamps pageSize to MAX_PAGE_SIZE (60)", () => {
        const url = catalogUrl("https://demo.inelabteamdev.com", 3, 100);
        expect(url.searchParams.get("page")).toBe("3");
        expect(url.searchParams.get("pageSize")).toBe("60");
    });
});

describe("Catalog schemas", () => {
    it("validates a well-formed catalog product", () => {
        const validProduct = {
            id: 101,
            slug: "test-product",
            name: "Test Product",
            brand: "TestBrand",
            category: "Electronics",
            sku: "SKU-101",
            description: "A test description.",
        };
        const parsed = CatalogProductSchema.parse(validProduct);
        expect(parsed.id).toBe(101);
        expect(parsed.name).toBe("Test Product");
    });

    it("fails validation if a required product field is missing or invalid", () => {
        const invalidProduct = {
            id: "not-a-number",
            name: "Broken",
        };
        expect(() => CatalogProductSchema.parse(invalidProduct)).toThrow();
    });

    it("validates a well-formed catalog page", () => {
        const validPage = {
            page: 1,
            pageSize: 20,
            pages: 50,
            total: 1000,
            items: [
                {
                    id: 1,
                    slug: "item-1",
                    name: "Item 1",
                    brand: "Brand A",
                    category: "Cat A",
                    sku: "SKU-1",
                    description: "Desc",
                },
            ],
        };
        const parsed = CatalogPageSchema.parse(validPage);
        expect(parsed.page).toBe(1);
        expect(parsed.items.length).toBe(1);
    });
});

describe("CatalogStructureError", () => {
    it("inherits from Error with name CatalogStructureError", () => {
        const err = new CatalogStructureError("malformed structure");
        expect(err instanceof Error).toBe(true);
        expect(err instanceof CatalogStructureError).toBe(true);
        expect(err.name).toBe("CatalogStructureError");
        expect(err.message).toBe("malformed structure");
    });
});

describe("fetchCatalogPage argument validation", () => {
    it("throws an error when page is less than 1 or not an integer", async () => {
        await expect(fetchCatalogPage(0)).rejects.toThrow("Invalid catalog page: 0");
        await expect(fetchCatalogPage(-5)).rejects.toThrow("Invalid catalog page: -5");
        await expect(fetchCatalogPage(1.5)).rejects.toThrow("Invalid catalog page: 1.5");
        await expect(fetchCatalogPage("1")).rejects.toThrow("Invalid catalog page: 1");
    });
});

describe("fetchCatalogPage network and parsing", () => {
    it("successfully fetches and parses catalog page", async () => {
        const mockPayload = {
            page: 1,
            pageSize: 2,
            pages: 1,
            total: 2,
            items: [
                {
                    id: 1,
                    slug: "prod-1",
                    name: "Product 1",
                    brand: "Brand 1",
                    category: "Cat 1",
                    sku: "SKU-1",
                    description: "Desc 1",
                },
                {
                    id: 2,
                    slug: "prod-2",
                    name: "Product 2",
                    brand: "Brand 2",
                    category: "Cat 2",
                    sku: "SKU-2",
                    description: "Desc 2",
                },
            ],
        };

        globalThis.fetch = async () =>
            new Response(JSON.stringify(mockPayload), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        const result = await fetchCatalogPage(1, { baseUrl: "https://example.com" });
        expect(result.page).toBe(1);
        expect(result.total).toBe(2);
        expect(result.items.length).toBe(2);
        expect(result.items[0].name).toBe("Product 1");
    });

    it("throws CatalogStructureError when payload is invalid JSON", async () => {
        globalThis.fetch = async () =>
            new Response("not json", {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        await expect(
            fetchCatalogPage(1, { baseUrl: "https://example.com", retries: 0 }),
        ).rejects.toThrow(CatalogStructureError);
    });

    it("throws CatalogStructureError when payload fails Zod schema", async () => {
        globalThis.fetch = async () =>
            new Response(JSON.stringify({ unexpected: "structure" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        await expect(
            fetchCatalogPage(1, { baseUrl: "https://example.com", retries: 0 }),
        ).rejects.toThrow(CatalogStructureError);
    });

    it("retries on retryable HTTP statuses and succeeds if a later attempt succeeds", async () => {
        let attempts = 0;
        const mockPayload = {
            page: 1,
            pageSize: 20,
            pages: 1,
            total: 1,
            items: [
                {
                    id: 1,
                    slug: "p-1",
                    name: "P1",
                    brand: "B",
                    category: "C",
                    sku: "S",
                    description: "D",
                },
            ],
        };

        globalThis.fetch = async () => {
            attempts++;
            if (attempts === 1) {
                return new Response("Too Many Requests", { status: 429 });
            }
            return new Response(JSON.stringify(mockPayload), { status: 200 });
        };

        const result = await fetchCatalogPage(1, {
            baseUrl: "https://example.com",
            retries: 2,
        });
        expect(attempts).toBe(2);
        expect(result.items.length).toBe(1);
    });

    it("aborts without retrying on non-retryable 4xx like 404", async () => {
        let attempts = 0;
        globalThis.fetch = async () => {
            attempts++;
            return new Response("Not Found", { status: 404 });
        };

        await expect(
            fetchCatalogPage(1, { baseUrl: "https://example.com", retries: 3 }),
        ).rejects.toThrow("HTTP 404");
        expect(attempts).toBe(1);
    });
});

describe("collectProducts", () => {
    it("collects items across pages until total is met", async () => {
        const pagesData = {
            1: {
                page: 1,
                pageSize: 1,
                pages: 2,
                total: 2,
                items: [
                    {
                        id: 1,
                        slug: "p-1",
                        name: "P1",
                        brand: "B",
                        category: "C",
                        sku: "S",
                        description: "D",
                    },
                ],
            },
            2: {
                page: 2,
                pageSize: 1,
                pages: 2,
                total: 2,
                items: [
                    {
                        id: 2,
                        slug: "p-2",
                        name: "P2",
                        brand: "B",
                        category: "C",
                        sku: "S",
                        description: "D",
                    },
                ],
            },
        };

        globalThis.fetch = async (url) => {
            const pageNum = new URL(url).searchParams.get("page");
            const data = pagesData[pageNum] ?? pagesData[1];
            return new Response(JSON.stringify(data), { status: 200 });
        };

        const progressUpdates = [];
        const result = await collectProducts({
            baseUrl: "https://example.com",
            maxRequests: 5,
            delayMs: 0,
            onProgress: (p) => progressUpdates.push(p),
        });

        expect(result.total).toBe(2);
        expect(result.complete).toBe(true);
        expect(result.products.length).toBe(2);
        expect(result.requests).toBe(2);
        expect(result.failures).toBe(0);
        expect(progressUpdates.length).toBe(2);
    });

    it("rethrows CatalogStructureError if encountered during collection", async () => {
        globalThis.fetch = async () =>
            new Response(JSON.stringify({ bad: "shape" }), { status: 200 });

        await expect(
            collectProducts({
                baseUrl: "https://example.com",
                maxRequests: 2,
                delayMs: 0,
            }),
        ).rejects.toThrow(CatalogStructureError);
    });

    it("tracks failures and continues when transient errors occur", async () => {
        let calls = 0;
        globalThis.fetch = async () => {
            calls++;
            if (calls === 1) {
                return new Response("Not Found", { status: 404 });
            }
            return new Response(
                JSON.stringify({
                    page: 1,
                    pageSize: 1,
                    pages: 1,
                    total: 1,
                    items: [
                        {
                            id: 10,
                            slug: "p-10",
                            name: "P10",
                            brand: "B",
                            category: "C",
                            sku: "S",
                            description: "D",
                        },
                    ],
                }),
                { status: 200 },
            );
        };

        const result = await collectProducts({
            baseUrl: "https://example.com",
            maxRequests: 2,
            delayMs: 0,
            retries: 0,
        });

        expect(result.failures).toBe(1);
        expect(result.requests).toBe(2);
        expect(result.products.length).toBe(1);
        expect(result.complete).toBe(true);
    });
});
