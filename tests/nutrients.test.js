import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  catalog,
  parseNumber,
  saltToSodiumMg,
  scalePer100,
  convertAmount,
} from "../src/nutrients.js";

describe("catalog", () => {
  test("returns an object with all expected keys (AC-1)", () => {
    const c = catalog();
    assert.ok(typeof c === "object");
    assert.ok("energyKj" in c);
    assert.ok("energyKcal" in c);
    assert.ok("fat" in c);
    assert.ok("saturates" in c);
    assert.ok("carbohydrate" in c);
    assert.ok("sugars" in c);
    assert.ok("protein" in c);
    assert.ok("salt" in c);
    assert.ok("sodium" in c);
    assert.ok("vitaminC" in c);
    assert.ok("vitaminD" in c);
  });

  test("all values are 0 by default (AC-1)", () => {
    const c = catalog();
    for (const key of Object.keys(c)) {
      assert.strictEqual(c[key], 0);
    }
  });
});

describe("parseNumber", () => {
  test("parses plain integers (AC-2)", () => {
    assert.strictEqual(parseNumber("42"), 42);
  });

  test("parses decimals (AC-2)", () => {
    assert.strictEqual(parseNumber("3.14"), 3.14);
  });

  test("parses strings with commas as decimal separators (AC-2)", () => {
    assert.strictEqual(parseNumber("3,14"), 3.14);
  });

  test("strips units like 'g' or 'mg' (AC-2)", () => {
    assert.strictEqual(parseNumber("42g"), 42);
    assert.strictEqual(parseNumber("100mg"), 100);
  });

  test("strips % sign (AC-2)", () => {
    assert.strictEqual(parseNumber("63%"), 63);
  });

  test("returns NaN for unparseable strings (AC-2)", () => {
    assert.strictEqual(Number.isNaN(parseNumber("abc")), true);
  });

  test("handles empty string (AC-2)", () => {
    assert.strictEqual(Number.isNaN(parseNumber("")), true);
  });
});

describe("saltToSodiumMg", () => {
  test("converts salt (g) to sodium (mg): salt * 1000 / 2.5 (AC-3)", () => {
    // 1g salt = 400mg sodium
    assert.strictEqual(saltToSodiumMg(1), 400);
    assert.strictEqual(saltToSodiumMg(0.5), 200);
    assert.strictEqual(saltToSodiumMg(2), 800);
  });

  test("handles zero (AC-3)", () => {
    assert.strictEqual(saltToSodiumMg(0), 0);
  });

  test("handles decimals (AC-3)", () => {
    assert.strictEqual(saltToSodiumMg(0.1), 40);
  });
});

describe("scalePer100", () => {
  test("scales a value from per-portion to per-100g (AC-4)", () => {
    // portion is 250g, value is 10 -> per 100 = 10 * 100 / 250 = 4
    assert.strictEqual(scalePer100(10, 250), 4);
  });

  test("scales when portion equals 100 (AC-4)", () => {
    assert.strictEqual(scalePer100(42, 100), 42);
  });

  test("handles fractional portions (AC-4)", () => {
    // portion 50g, value 5 -> per 100 = 5 * 100 / 50 = 10
    assert.strictEqual(scalePer100(5, 50), 10);
  });

  test("handles zero portion (AC-4)", () => {
    assert.strictEqual(scalePer100(10, 0), 0);
  });
});

describe("convertAmount", () => {
  test("converts per-portion to per-100g (AC-5)", () => {
    assert.strictEqual(convertAmount(10, 250), 4);
  });

  test("converts when already per-100 (AC-5)", () => {
    assert.strictEqual(convertAmount(42, 100), 42);
  });

  test("handles zero portion (AC-5)", () => {
    assert.strictEqual(convertAmount(10, 0), 0);
  });
});