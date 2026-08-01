import assert from "node:assert/strict";
import test from "node:test";

globalThis.crypto ??= (await import("node:crypto")).webcrypto;

const { migrateLegacyPassengers, syncPassengersToPeople } = await import("../lib/passengers.ts");

test("creates a 100% roster including the driver", () => {
  const passengers = syncPassengersToPeople([], 4);
  assert.equal(passengers.length, 4);
  assert.deepEqual(passengers.map(({ name, weight }) => ({ name, weight })), [
    { name: "司機", weight: 100 },
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
  assert.equal(expanded.length, 5);
  assert.deepEqual(expanded.slice(0, 2), existing);
  assert.deepEqual(expanded.slice(2).map((person) => person.weight), [100, 100, 100]);

  const reduced = syncPassengersToPeople(expanded, 2);
  assert.deepEqual(reduced, existing);
});

test("migrates the old passenger-only list by prepending a driver", () => {
  const legacy = [
    { id: "a", name: "乘客 A", weight: 60 },
    { id: "b", name: "乘客 B", weight: 100 },
    { id: "c", name: "乘客 C", weight: 100 },
  ];
  const migrated = migrateLegacyPassengers(legacy, 4);
  assert.equal(migrated.length, 4);
  assert.deepEqual(migrated[0], { id: migrated[0].id, name: "司機", weight: 100 });
  assert.deepEqual(migrated.slice(1), legacy);
});
