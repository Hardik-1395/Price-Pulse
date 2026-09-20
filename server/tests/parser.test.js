import { describe, expect, it } from "bun:test";
import { PageContentSchema, parsePage } from "../src/lib/Scaper/parser.js";

// ---------------------------------------------------------------------------
// Schema tests (pure — no DOM)
// ---------------------------------------------------------------------------

describe("PageContentSchema", () => {
    it("validates a complete, well-formed PageContent object", () => {
        const content = {
            title: "Test Page",
            description: "A test page",
            canonical: "https://example.com/test",
            lang: "en",
            headings: [{ level: 1, text: "Hello" }],
            links: [{ href: "https://example.com", text: "Home" }],
            images: [{ src: "https://example.com/img.png", alt: "image" }],
            scripts: ["https://example.com/bundle.js"],
            clientRendered: false,
            meta: { description: "A test page" },
            openGraph: { "og:title": "Test" },
            text: "Hello world",
        };
        const parsed = PageContentSchema.parse(content);
        expect(parsed.title).toBe("Test Page");
        expect(parsed.canonical).toBe("https://example.com/test");
    });

    it("allows canonical and lang to be null", () => {
        const content = {
            title: "",
            description: "",
            canonical: null,
            lang: null,
            headings: [],
            links: [],
            images: [],
            scripts: [],
            clientRendered: false,
            meta: {},
            openGraph: {},
            text: "",
        };
        expect(() => PageContentSchema.parse(content)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// parsePage — core behavior
// ---------------------------------------------------------------------------

describe("parsePage — title, description, meta", () => {
    it("extracts the page title", () => {
        const result = parsePage("<html><head><title>My Shop</title></head><body></body></html>");
        expect(result.title).toBe("My Shop");
    });

    it("extracts meta description", () => {
        const html = `<html><head>
      <meta name="description" content="Great products here">
    </head><body></body></html>`;
        const result = parsePage(html);
        expect(result.description).toBe("Great products here");
    });

    it("extracts Open Graph tags into openGraph and also into meta", () => {
        const html = `<html><head>
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Desc">
    </head><body></body></html>`;
        const result = parsePage(html);
        expect(result.openGraph["og:title"]).toBe("OG Title");
        expect(result.meta["og:title"]).toBe("OG Title");
    });

    it("extracts lang from html element; returns null if absent", () => {
        const withLang = parsePage('<html lang="en-US"><head></head><body></body></html>');
        expect(withLang.lang).toBe("en-US");

        const noLang = parsePage("<html><head></head><body></body></html>");
        expect(noLang.lang).toBeNull();
    });

    it("extracts canonical link; returns null if absent", () => {
        const withCanonical = parsePage(
            '<html><head><link rel="canonical" href="https://example.com/page"></head><body></body></html>',
            "https://example.com",
        );
        expect(withCanonical.canonical).toBe("https://example.com/page");

        const noCanonical = parsePage("<html><head></head><body></body></html>");
        expect(noCanonical.canonical).toBeNull();
    });
});

describe("parsePage — headings", () => {
    it("collects h1–h6 with their numeric level", () => {
        const html = `<html><body>
      <h1>Main</h1>
      <h2>Sub</h2>
      <h3>Deep</h3>
    </body></html>`;
        const result = parsePage(html);
        expect(result.headings).toHaveLength(3);
        expect(result.headings[0]).toEqual({ level: 1, text: "Main" });
        expect(result.headings[2]).toEqual({ level: 3, text: "Deep" });
    });

    it("drops headings with empty text after normalization", () => {
        const html = "<html><body><h1>   </h1><h2>Real</h2></body></html>";
        const result = parsePage(html);
        expect(result.headings).toHaveLength(1);
        expect(result.headings[0].text).toBe("Real");
    });
});

describe("parsePage — links", () => {
    it("collects anchor links with text", () => {
        const html = `<html><body>
      <a href="/about">About Us</a>
      <a href="https://external.com">External</a>
    </body></html>`;
        const result = parsePage(html, "https://example.com");
        expect(result.links).toHaveLength(2);
        expect(result.links[0].href).toBe("https://example.com/about");
        expect(result.links[1].href).toBe("https://external.com/");
    });

    it("excludes anchors without href", () => {
        const html = `<html><body>
      <a href="/ok">OK</a>
      <a>No href</a>
    </body></html>`;
        const result = parsePage(html, "https://example.com");
        expect(result.links).toHaveLength(1);
    });
});

describe("parsePage — images", () => {
    it("collects images with src and normalized alt", () => {
        const html = `<html><body>
      <img src="/img/hero.png" alt="  Hero Image  ">
    </body></html>`;
        const result = parsePage(html, "https://example.com");
        expect(result.images).toHaveLength(1);
        expect(result.images[0].src).toBe("https://example.com/img/hero.png");
        expect(result.images[0].alt).toBe("Hero Image");
    });

    it("uses data-src when src is absent (lazy-loaded images)", () => {
        const html = `<html><body>
      <img data-src="/lazy.jpg" alt="Lazy">
    </body></html>`;
        const result = parsePage(html, "https://example.com");
        expect(result.images[0].src).toBe("https://example.com/lazy.jpg");
    });

    it("drops images with neither src nor data-src", () => {
        const html = "<html><body><img alt='no source'></body></html>";
        const result = parsePage(html);
        expect(result.images).toHaveLength(0);
    });

    it("normalizes missing alt to empty string", () => {
        const html = `<html><body><img src="/img.png"></body></html>`;
        const result = parsePage(html, "https://example.com");
        expect(result.images[0].alt).toBe("");
    });
});

describe("parsePage — scripts and clientRendered detection", () => {
    it("collects external script srcs", () => {
        const html = `<html><head>
      <script src="/bundle.js"></script>
      <script src="https://cdn.example.com/lib.js"></script>
    </head><body></body></html>`;
        const result = parsePage(html, "https://example.com");
        expect(result.scripts).toHaveLength(2);
        expect(result.scripts[0]).toBe("https://example.com/bundle.js");
    });

    it("marks clientRendered=true when text is empty but scripts are present", () => {
        // This is the SPA shell pattern: the store's /product pages return exactly this
        const html = `<html><head>
      <script src="/assets/index.js"></script>
    </head><body><div id="root"></div></body></html>`;
        const result = parsePage(html);
        expect(result.clientRendered).toBe(true);
        expect(result.text).toBe("");
    });

    it("marks clientRendered=false when text is non-empty even with scripts", () => {
        const html = `<html><head>
      <script src="/app.js"></script>
    </head><body><p>Some content here</p></body></html>`;
        const result = parsePage(html);
        expect(result.clientRendered).toBe(false);
        expect(result.text.length).toBeGreaterThan(0);
    });

    it("marks clientRendered=false when there are no scripts (empty page)", () => {
        const html = "<html><body></body></html>";
        const result = parsePage(html);
        expect(result.clientRendered).toBe(false);
    });
});

describe("parsePage — text extraction and normalization", () => {
    it("strips script and style content from body text", () => {
        const html = `<html><body>
      <script>var x = 1;</script>
      <style>.a { color: red }</style>
      <p>Visible text only</p>
    </body></html>`;
        const result = parsePage(html);
        expect(result.text).not.toContain("var x");
        expect(result.text).not.toContain("color: red");
        expect(result.text).toContain("Visible text only");
    });

    it("collapses internal whitespace in text", () => {
        const html = "<html><body><p>  Word1   Word2  </p></body></html>";
        const result = parsePage(html);
        expect(result.text).not.toMatch(/  /);
    });
});

describe("parsePage — return shape", () => {
    it("always returns all required fields", () => {
        const result = parsePage("<html><body>Hello</body></html>");
        expect(typeof result.title).toBe("string");
        expect(typeof result.description).toBe("string");
        expect(typeof result.clientRendered).toBe("boolean");
        expect(Array.isArray(result.headings)).toBe(true);
        expect(Array.isArray(result.links)).toBe(true);
        expect(Array.isArray(result.images)).toBe(true);
        expect(Array.isArray(result.scripts)).toBe(true);
        expect(typeof result.meta).toBe("object");
        expect(typeof result.openGraph).toBe("object");
        expect(typeof result.text).toBe("string");
    });
});
