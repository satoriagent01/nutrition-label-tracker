import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  NUTRIENTS,
  NUTRIENT_ALIASES,
  getNutrient,
  parseNumber,
  round2,
  saltToSodiumMg,
  scalePer100,
  convertAmount,
  nutrientValue,
  dishTotal,
  dayTotal,
  compareTarget,
  sodiumMg
} from "../src/nutrients.js";

const TOL = 1e-9;

function approx(a, b, msg) {
  if (a === null && b === null) return;
  assert.strictEqual(typeof a, typeof b, msg);
  if (a === null) { assert.strictEqual(b, null, msg); return; }
  assert.ok(Math.abs(a - b) <= TOL, msg);
}

describe("NUTRIENTS catalog (AC-13)", () => {
  test("has exactly 13 entries", () => {
    assert.strictEqual(NUTRIENTS.length, 13);
  });

  test("has correct ids in order", () => {
    const ids = NUTRIENTS.map(n => n.id);
    assert.deepStrictEqual(ids, [
      "energy_kj", "energy_kcal", "fat", "saturates", "unsaturates",
      "monounsaturates", "polyunsaturates", "carbohydrate", "sugars",
      "fibre", "protein", "salt", "sodium"
    ]);
  });

  test("sodium unit is mg", () => {
    const sodium = NUTRIENTS.find(n => n.id === "sodium");
    assert.strictEqual(sodium.unit, "mg");
  });
});

describe("NUTRIENT_ALIASES (AC-2, AC-18)", () => {
  test("has all 13 ids as keys", () => {
    const ids = NUTRIENTS.map(n => n.id);
    for (const id of ids) {
      assert.ok(Array.isArray(NUTRIENT_ALIASES[id]), `missing aliases for ${id}`);
    }
  });

  test("energy aliases include common terms", () => {
    assert.ok(NUTRIENT_ALIASES.energy.includes("energie"));
    assert.ok(NUTRIENT_ALIASES.energy.includes("energy"));
  });

  test("fat aliases include multilingual terms", () => {
    assert.ok(NUTRIENT_ALIASES.fat.includes("fett"));
    assert.ok(NUTRIENT_ALIASES.fat.includes("vetten"));
    assert.ok(NUTRIENT_ALIASES.fat.includes("grasas"));
  });

  test("unsaturates aliases exist (AC-2)", () => {
    assert.ok(NUTRIENT_ALIASES.unsaturates.length > 0);
    assert.ok(NUTRIENT_ALIASES.unsaturates.includes("waarvan onverzadigde vetzuren"));
  });
});

describe("getNutrient (AC-13)", () => {
  test("returns nutrient by id", () => {
    const n = getNutrient("fat");
    assert.strictEqual(n.id, "fat");
    assert.strictEqual(n.name_es, "Grasas");
    assert.strictEqual(n.unit, "g");
  });

  test("returns null for unknown id", () => {
    assert.strictEqual(getNutrient("unknown"), null);
  });
});

describe("parseNumber (AC-5)", () => {
  test("parses dot decimal", () => {
    assert.strictEqual(parseNumber("2.4"), 2.4);
  });

  test("parses comma decimal", () => {
    assert.strictEqual(parseNumber("0,18"), 0.18);
  });

  test("parses integer", () => {
    assert.strictEqual(parseNumber("33"), 33);
  });

  test("returns null for empty string", () => {
    assert.strictEqual(parseNumber(""), null);
  });

  test("returns null for null", () => {
    assert.strictEqual(parseNumber(null), null);
  });

  test("returns null for unreadable text", () => {
    assert.strictEqual(parseNumber("—"), null);
  });
});

describe("round2 (AC-20)", () => {
  test("rounds to 2 decimal places", () => {
    assert.strictEqual(round2(2.456), 2.46);
    assert.strictEqual(round2(0.004), 0);
    assert.strictEqual(round2(1.005), 1.01);
  });
});

describe("saltToSodiumMg (AC-6)", () => {
  test("converts 0.18 g salt to 72 mg sodium", () => {
    approx(saltToSodiumMg(0.18), 72);
  });

  test("returns null for null", () => {
    assert.strictEqual(saltToSodiumMg(null), null);
  });

  test("converts 0 g salt to 0", () => {
    approx(saltToSodiumMg(0), 0);
  });
});

describe("scalePer100 (AC-11, AC-20)", () => {
  test("scales 55 per 100 to 30 g → 16.5", () => {
    approx(scalePer100(55, 30), 16.5);
  });

  test("returns null for null value", () => {
    assert.strictEqual(scalePer100(null, 30), null);
  });

  test("returns null for null amount", () => {
    assert.strictEqual(scalePer100(55, null), null);
  });
});

describe("convertAmount", () => {
  test("same basis returns value unchanged", () => {
    assert.strictEqual(convertAmount({ value: 55, from: "g", to: "g" }), 55);
  });

  test("cross g→ml with density", () => {
    // 55 g with density 1.2 g/ml → 55 * 1.2 = 66 ml
    approx(convertAmount({ value: 55, from: "g", to: "ml", density: 1.2 }), 66);
  });

  test("cross ml→g with density", () => {
    // 100 ml with density 1.2 g/ml → 100 / 1.2 = 83.333... g
    approx(convertAmount({ value: 100, from: "ml", to: "g", density: 1.2 }), 100 / 1.2);
  });

  test("cross-basis without density returns null", () => {
    assert.strictEqual(convertAmount({ value: 55, from: "g", to: "ml" }), null);
  });
});

describe("sodiumMg (AC-6)", () => {
  test("derived sodium from salt", () => {
    const product = {
      per100: { salt: 0.18, sodium: null },
      portion: { salt: 0.05, sodium: null }
    };
    approx(sodiumMg(product, "per100"), 72);
  });

  test("printed sodium wins over derived", () => {
    const product = {
      per100: { salt: 0.18, sodium: 100 },
      portion: { salt: 0.05, sodium: null }
    };
    approx(sodiumMg(product, "per100"), 100);
  });

  test("returns null when both salt and sodium are null", () => {
    const product = {
      per100: { salt: null, sodium: null },
      portion: { salt: null, sodium: null }
    };
    assert.strictEqual(sodiumMg(product, "per100"), null);
  });
});

describe("nutrientValue", () => {
  test("returns per100 value", () => {
    const product = {
      per100: { carbohydrate: 55, sodium: null },
      portion: { carbohydrate: 16, sodium: null }
    };
    approx(nutrientValue(product, "carbohydrate", "per100"), 55);
  });

  test("returns sodium in mg (derived)", () => {
    const product = {
      per100: { salt: 0.18, sodium: null },
      portion: { salt: 0.05, sodium: null }
    };
    approx(nutrientValue(product, "sodium", "per100"), 72);
  });
});

describe("dishTotal", () => {
  test("computes dish total from per100 values", () => {
    const product = {
      basis: "g",
      per100: { carbohydrate: 55, fat: 33, sodium: null, salt: 0.18 },
      portion: null
    };
    const total = dishTotal([
      { product, amount: 30 }
    ], "carbohydrate");
    approx(total, 16.5);
  });

  test("sodium in dish total is in mg", () => {
    const product = {
      basis: "g",
      per100: { salt: 0.18, sodium: null },
      portion: null
    };
    const total = dishTotal([
      { product, amount: 30 }
    ], "sodium");
    approx(total, 21.6);
  });
});

describe("dayTotal", () => {
  test("sums dish totals", () => {
    const d1 = 16.5;
    const d2 = 33;
    const total = dayTotal([d1, d2], "carbohydrate");
    approx(total, 49.5);
  });

  test("null dish total propagates", () => {
    const total = dayTotal([16.5, null], "carbohydrate");
    assert.strictEqual(total, null);
  });
});

describe("compareTarget (AC-8)", () => {
  test("unknown when total is null", () => {
    assert.strictEqual(compareTarget(null, { min: 0, max: 300 }), "unknown");
  });

  test("under when below min", () => {
    assert.strictEqual(compareTarget(10, { min: 50, max: 300 }), "under");
  });

  test("over when above max", () => {
    assert.strictEqual(compareTarget(350, { min: 0, max: 300 }), "over");
  });

  test("ok when within range", () => {
    assert.strictEqual(compareTarget(150, { min: 0, max: 300 }), "ok");
  });

  test("ok when only min set and above", () => {
    assert.strictEqual(compareTarget(100, { min: 50, max: null }), "ok");
  });

  test("ok when only max set and below", () => {
    assert.strictEqual(compareTarget(100, { min: null, max: 200 }), "ok");
  });
});