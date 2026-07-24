import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const repository = "carpool-fare-calculator";
const base = `/${repository}`;
const siteOrigin = `https://autoscotland.github.io${base}`;
const output = resolve("pages-output");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve("dist/client"), output, { recursive: true });

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("pages", Date.now().toString());
const { default: worker } = await import(workerUrl.href);
const response = await worker.fetch(
  new Request("http://localhost/"),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

if (!response.ok) throw new Error(`Static render failed: ${response.status}`);

let html = await response.text();
html = html
  .replaceAll("http://localhost:3000/", `${siteOrigin}/`)
  .replace(/(["'])\/(assets|data)\//g, `$1${base}/$2/`)
  .replace(/(["'])\/(manifest\.json|favicon\.svg|og\.png|sw\.js)/g, `$1${base}/$2`);

await writeFile(resolve(output, "index.html"), html);
await writeFile(resolve(output, "404.html"), html);
await writeFile(resolve(output, ".nojekyll"), "");

const manifestPath = resolve(output, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.start_url = `${base}/`;
manifest.scope = `${base}/`;
manifest.icons = manifest.icons.map((icon) => ({
  ...icon,
  src: `${base}${icon.src.startsWith("/") ? icon.src : `/${icon.src}`}`,
}));
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`GitHub Pages artifact ready at ${output}`);
