import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("loads the live fuel price with a bundled fallback", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /autoscotland\.github\.io\/carpool-fare-calculator\/data\/fuel-price\.json/);
  assert.match(source, /cache: "no-store"/);
  assert.match(source, /bundled fuel price unavailable/);
});

test("checks CPC fuel prices twice every day", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/update-fuel-price.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /cron: "0 2,10 \* \* \*"/);
});
