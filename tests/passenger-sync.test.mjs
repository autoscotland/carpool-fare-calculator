import assert from "node:assert/strict";
import test from "node:test";

globalThis.crypto ??= (await import("node:crypto")).webcrypto;

const { syncPassengersToPeople } = await import("../lib/passengers.ts");

test("creates one 100% passenger for every non-driver seat", () => {
  const passengers = syncPassengersToPeople([], 4);
  assert.equal(passengers.length, 3);
  assert.deepEqual(passengers.map(({ name, weight }) => ({ name, weight })), [
    { name: "乘客 1", weight: 100 },
    { name: "乘客 2", weight: 100 },
    { name: "乘客 3", weight: 100 },
  ]);
});

test("preserves existing entries while adding and removing seats", () => {
  const existing = [
    { id: "a", name: "小明", weight: 60 },
    { id: "b", name: "小美", weight: 100 },
  ];
  const expanded = syncPassengersToPeople(existing, 5);
  assert.equal(expanded.length, 4);
  assert.deepEqual(expanded.slice(0, 2), existing);
  assert.deepEqual(expanded.slice(2).map((person) => person.weight), [100, 100]);

  const reduced = syncPassengersToPeople(expanded, 2);
  assert.deepEqual(reduced, [existing[0]]);
});
