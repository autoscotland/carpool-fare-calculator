import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the carpool calculator", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>共乘帳本｜車資分攤計算器<\/title>/);
  assert.match(html, /建議每位乘客收費/);
  assert.match(html, /高雄・白河一日行程/);
  assert.match(html, /車主保本/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("includes installable app metadata", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /manifest\.json/);
  assert.match(html, /og\.png/);
});
