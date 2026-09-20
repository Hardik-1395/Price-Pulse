import express from "express";
import cors from "cors";
import { runDueScrapes } from "./lib/Scheduler/run.js";
import {
    list as listProducts,
    getById as getProductById,
    searchByName,
} from "./lib/Models/products.js";
import { listByProduct } from "./lib/Models/priceHistory.js";
import {
    listActive,
    ensureDefault as ensureDefaultAlerts,
    disable as disableAlert,
} from "./lib/Models/alerts.js";
import { track, deactivate } from "./lib/Models/trackedProducts.js";
import { list as listScrapeLogs } from "./lib/Models/scrapeLog.js";
import { list as listDashboard } from "./lib/Models/dashboard.js";
import requireAdmin from "./lib/middleware/requireAdmin.js";

const app = express();

app.use(cors());
app.use(express.json());

// Wraps an async route so a thrown error reaches the error middleware instead of floating.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Product ids are positive integers. Returns null on anything else so callers can 400.
function intParam(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function clampLimit(value, fallback, max) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) return fallback;
    return Math.min(n, max);
}

// --- Public (user) ---------------------------------------------------------

app.get("/", (req, res) => {
    res.json({ message: "PricePulse API" });
});

app.get(
    "/products",
    asyncHandler(async (req, res) => {
        res.json(await listProducts());
    }),
);

// Declared before `/products/:id` so "search" isn't captured as an id.
app.get(
    "/products/search",
    asyncHandler(async (req, res) => {
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (!q) return res.status(400).json({ error: "Missing required query param: q" });

        res.json(await searchByName(q, { limit: clampLimit(req.query.limit, 20, 100) }));
    }),
);

app.get(
    "/products/:id",
    asyncHandler(async (req, res) => {
        const id = intParam(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid product id" });

        const product = await getProductById(id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        res.json(product);
    }),
);

app.get(
    "/products/:id/price-history",
    asyncHandler(async (req, res) => {
        const id = intParam(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid product id" });

        res.json(await listByProduct(id));
    }),
);

app.get(
    "/alerts",
    asyncHandler(async (req, res) => {
        const productId = intParam(req.query.productId);
        if (productId === null) {
            return res.status(400).json({ error: "Missing or invalid query param: productId" });
        }

        res.json(await listActive(productId));
    }),
);

app.get(
    "/dashboard",
    asyncHandler(async (req, res) => {
        res.json(await listDashboard());
    }),
);

// Proxy for frontend tracking without admin secret
app.post(
    "/api/proxy/track",
    asyncHandler(async (req, res) => {
        const productId = intParam(req.body?.productId);
        if (productId === null) {
            return res.status(400).json({ error: "Body must include an integer productId" });
        }

        const { frequencyMinutes } = req.body ?? {};
        if (frequencyMinutes !== undefined) {
            const n = Number(frequencyMinutes);
            if (!Number.isInteger(n) || n < 1) {
                return res.status(400).json({ error: "frequencyMinutes must be a positive integer" });
            }
        }

        if (!(await getProductById(productId))) {
            return res.status(404).json({ error: "Product not found" });
        }

        const tracked = await track(
            productId,
            frequencyMinutes === undefined ? {} : { frequencyMinutes: Number(frequencyMinutes) },
        );
        const alertsCreated = await ensureDefaultAlerts(productId);

        res.status(201).json({ tracked, alertsCreated });
    }),
);

// Proxy for frontend scrape logs without admin secret
app.get(
    "/api/proxy/scrape-logs",
    asyncHandler(async (req, res) => {
        const productId =
            req.query.productId === undefined ? undefined : intParam(req.query.productId);

        if (req.query.productId !== undefined && productId === null) {
            return res.status(400).json({ error: "Invalid productId" });
        }

        res.json(await listScrapeLogs({ limit: clampLimit(req.query.limit, 200, 1000), productId }));
    }),
);

// Proxy for scheduler run
app.post(
    "/api/proxy/scheduler/run",
    asyncHandler(async (req, res) => {
        res.json(await runDueScrapes());
    }),
);

// --- Admin (requires ADMIN_SECRET) -----------------------------------------

app.post(
    "/scheduler/run",
    requireAdmin,
    asyncHandler(async (req, res) => {
        res.json(await runDueScrapes());
    }),
);

app.get(
    "/scrape-logs",
    requireAdmin,
    asyncHandler(async (req, res) => {
        const productId =
            req.query.productId === undefined ? undefined : intParam(req.query.productId);

        if (req.query.productId !== undefined && productId === null) {
            return res.status(400).json({ error: "Invalid productId" });
        }

        res.json(await listScrapeLogs({ limit: clampLimit(req.query.limit, 200, 1000), productId }));
    }),
);

app.post(
    "/track",
    requireAdmin,
    asyncHandler(async (req, res) => {
        const productId = intParam(req.body?.productId);
        if (productId === null) {
            return res.status(400).json({ error: "Body must include an integer productId" });
        }

        const { frequencyMinutes } = req.body ?? {};
        if (frequencyMinutes !== undefined) {
            const n = Number(frequencyMinutes);
            if (!Number.isInteger(n) || n < 1) {
                return res.status(400).json({ error: "frequencyMinutes must be a positive integer" });
            }
        }

        if (!(await getProductById(productId))) {
            return res.status(404).json({ error: "Product not found" });
        }

        const tracked = await track(
            productId,
            frequencyMinutes === undefined ? {} : { frequencyMinutes: Number(frequencyMinutes) },
        );
        const alertsCreated = await ensureDefaultAlerts(productId);

        res.status(201).json({ tracked, alertsCreated });
    }),
);

app.delete(
    "/track/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
        const id = intParam(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid product id" });

        const tracked = await deactivate(id);
        if (!tracked) return res.status(404).json({ error: "Not tracking that product" });

        res.json(tracked);
    }),
);

app.post(
    "/alerts",
    requireAdmin,
    asyncHandler(async (req, res) => {
        const productId = intParam(req.body?.productId);
        if (productId === null) {
            return res.status(400).json({ error: "Body must include an integer productId" });
        }

        res.status(201).json({ created: await ensureDefaultAlerts(productId) });
    }),
);

app.delete(
    "/alerts/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
        if (!UUID_RE.test(req.params.id)) {
            return res.status(400).json({ error: "Invalid alert id" });
        }

        const alert = await disableAlert(req.params.id);
        if (!alert) return res.status(404).json({ error: "Alert not found" });

        res.json(alert);
    }),
);

// --- Errors ----------------------------------------------------------------

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.status(500).json({ error: error.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

