import assert from "node:assert/strict";
import test from "node:test";
import { initialMileageRate, nextMileageRate } from "../lib/fuel.ts";

[
  [7, 34.1, 8],
  [7, 34, 7],
  [8, 31.9, 7],
  [8, 32, 8],
  [6, 29.1, 7],
  [7, 26.9, 6],
  [5, 24.1, 6],
  [6, 21.9, 5],
  [7, 30, 7],
].forEach(([previous, price, expected]) => {
  test(`${previous} 元費率在油價 ${price} 時調整為 ${expected}`, () => {
    assert.equal(nextMileageRate(previous, price), expected);
  });
});

test("31.3 元首次初始化為 7 元/km", () => {
  assert.equal(initialMileageRate(31.3), 7);
});
