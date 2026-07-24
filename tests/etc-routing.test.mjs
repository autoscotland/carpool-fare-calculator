import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { findEtcRoute } from "../lib/etc.ts";

const network = JSON.parse(
  await readFile(new URL("../public/data/etc-network.json", import.meta.url), "utf8"),
);
const node = (road, name) =>
  network.nodes.find((item) => item.road === road && item.name === name);

test("calculates a directed single-highway ETC route", () => {
  const start = node("國道三號", "燕巢系統");
  const end = node("國道三號", "白河");
  const route = findEtcRoute(network, start.id, end.id);
  assert.ok(route);
  assert.ok(route.distance > 60);
  assert.ok(route.toll > 70);
  assert.deepEqual(route.roads, ["國道三號"]);
});

test("connects a free highway to a tolled highway at a system interchange", () => {
  const start = node("國道十號", "仁武");
  const end = node("國道三號", "白河");
  const route = findEtcRoute(network, start.id, end.id);
  assert.ok(route);
  assert.ok(route.roads.includes("國道十號"));
  assert.ok(route.roads.includes("國道三號"));
  assert.ok(route.toll > 0);
});

test("returns null for invalid or identical endpoints", () => {
  const start = node("國道三號", "白河");
  assert.equal(findEtcRoute(network, "", start.id), null);
  assert.equal(findEtcRoute(network, start.id, start.id), null);
});
