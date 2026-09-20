import * as cheerio from "cheerio";
import { z } from "zod";
import { SPACED_ELEMENTS } from "./constants.js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const HeadingSchema = z.object({
    level: z.number().int().min(1).max(6),
    text: z.string(),
});

const LinkSchema = z.object({
    href: z.string(),
    text: z.string(),
});

const ImageSchema = z.object({
    src: z.string(),
    alt: z.string(),
});

export const PageContentSchema = z.object({
    title: z.string(),
    description: z.string(),
    canonical: z.string().nullable(),
    lang: z.string().nullable(),
    headings: z.array(HeadingSchema),
    links: z.array(LinkSchema),
    images: z.array(ImageSchema),
    scripts: z.array(z.string()),
    clientRendered: z.boolean(),
    meta: z.record(z.string(), z.string()),
    openGraph: z.record(z.string(), z.string()),
    text: z.string(),
});

// ---------------------------------------------------------------------------
// Low-level text / URL helpers
// ---------------------------------------------------------------------------

// Collapse whitespace and trim — applied to every text node we extract.
function normalize(value) {
    return (value ?? "").replace(/\s+/g, " ").trim();
}

// Resolve a potentially relative href/src against a base URL.
// Falls back to the raw value if URL construction fails (e.g. mailto: or data: URLs).
function resolveUrl(href, baseUrl) {
    if (!href) return null;
    try {
        return new URL(href, baseUrl).href;
    } catch {
        return href;
    }
}

// ---------------------------------------------------------------------------
// Per-concern extraction helpers
// Each takes a Cheerio root ($) and the base URL; each returns a plain value.
// ---------------------------------------------------------------------------

// Collect the src attributes of external script tags BEFORE the DOM is cleaned.
// This must run first because the cleanup step removes <script> elements entirely.
// The presence of JS bundles is the signal for clientRendered detection.
function extractScripts($, baseUrl) {
    return $("script[src]")
        .map((_, el) => resolveUrl($(el).attr("src"), baseUrl))
        .get()
        .filter(Boolean);
}

// Collect all <meta> tags into a flat lowercase-keyed object.
// Both `name` and `property` attributes are treated as keys (handles Open Graph tags too).
function extractMeta($) {
    const meta = {};
    $("meta").each((_, el) => {
        const $el = $(el);
        const key = $el.attr("property") || $el.attr("name");
        const content = $el.attr("content");
        if (key && content) meta[key.toLowerCase()] = content;
    });
    return meta;
}

// Collect non-empty headings (h1–h6) with their numeric level.
function extractHeadings($) {
    return $("h1, h2, h3, h4, h5, h6")
        .map((_, el) => ({
            level: Number(el.tagName.slice(1)),
            text: normalize($(el).text()),
        }))
        .get()
        .filter((h) => h.text.length > 0);
}

// Collect all anchor links that carry an href attribute.
function extractLinks($, baseUrl) {
    return $("a[href]")
        .map((_, el) => ({
            href: resolveUrl($(el).attr("href"), baseUrl),
            text: normalize($(el).text()),
        }))
        .get();
}

// Collect images, preferring src over data-src (lazy-loaded images).
// Entries without a resolved src are dropped.
function extractImages($, baseUrl) {
    return $("img")
        .map((_, el) => {
            const $el = $(el);
            const src = $el.attr("src") || $el.attr("data-src");
            return src
                ? { src: resolveUrl(src, baseUrl), alt: normalize($el.attr("alt")) }
                : null;
        })
        .get()
        .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function parsePage(html, baseUrl = "") {
    const $ = cheerio.load(html);

    // Scripts must be collected before the DOM cleanup that removes <script> elements.
    // Their presence is used to detect client-rendered (SPA) pages below.
    const scripts = extractScripts($, baseUrl);

    // Strip non-content nodes and add spacing around block elements so that text()
    // produces readable words rather than everything run together.
    $("script, style, noscript, template, svg").remove();
    $("br").replaceWith(" ");
    $(SPACED_ELEMENTS).each((_, el) => {
        $(el).append(" ");
    });

    const meta = extractMeta($);
    const headings = extractHeadings($);
    const links = extractLinks($, baseUrl);
    const images = extractImages($, baseUrl);
    const text = normalize($("body").text() || $.root().text());

    // clientRendered distinguishes "the page genuinely has no text content" from
    // "the content is assembled by JavaScript after load". Without this flag, a SPA
    // shell (headings=0, links=0, text=0) looks identical to a broken selector.
    const clientRendered = text.length === 0 && scripts.length > 0;

    const content = {
        title: normalize($("title").first().text()),
        description: meta.description ?? "",
        canonical: resolveUrl($('link[rel="canonical"]').first().attr("href"), baseUrl),
        lang: $("html").attr("lang") ?? null,
        headings,
        links,
        images,
        scripts,
        clientRendered,
        meta,
        openGraph: Object.fromEntries(
            Object.entries(meta).filter(([key]) => key.startsWith("og:")),
        ),
        text,
    };

    return PageContentSchema.parse(content);
}
