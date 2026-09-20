#!/usr/bin/env bun
/**
 * Run one scheduler pass: scrape every overdue tracked product.
 *
 *   bun scripts/run-scheduler.js [--json]
 */
import { runDueScrapes } from "../src/lib/Scheduler/run.js";

const flags = {};
for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    flags[key] = value ?? true;
}

const clock = () => performance.now();
const start = clock();

try {
    const summary = await runDueScrapes();

    console.log(
        `\n  claimed=${summary.claimed}  succeeded=${summary.succeeded}` +
            `  failed=${summary.failed}  structure_error=${summary.structureError}` +
            `  alerts_fired=${summary.alertsFired}  in ${((clock() - start) / 1000).toFixed(1)}s`,
    );

    if (flags.json) console.log(JSON.stringify(summary, null, 2));
} catch (error) {
    console.error(`\nSCHEDULER FAILED: ${error.name}: ${error.message}`);
    process.exitCode = 1;
}
