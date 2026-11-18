import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evaluateRule, evaluateAll, validateContext, isValidIsoDate } from "../js/engine.js";
import { makeRule, makeContext } from "./helpers.js";

describe("evaluateRule", () => {
  test("grants percent of deposit when all checks pass", () => {
    const result = evaluateRule(makeRule(), makeContext({ amount: 200 }));
    assert.equal(result.eligible, true);
    assert.equal(result.bonus, 200);
    assert.equal(result.wageringRequirement, 6000);
  });

  test("caps bonus at maxBonus", () => {
    const result = evaluateRule(makeRule({ maxBonus: 500 }), makeContext({ amount: 2000 }));
    assert.equal(result.bonus, 500);
  });

  // Boundary value analysis around minDeposit = 100
  for (const [amount, expected] of [[99.99, false], [100, true], [100.01, true]]) {
    test(`deposit ${amount} vs minDeposit 100 → eligible=${expected}`, () => {
      const result = evaluateRule(makeRule({ minDeposit: 100 }), makeContext({ amount }));
      assert.equal(result.eligible, expected);
    });
  }

  // Boundary value analysis around campaign dates
  for (const [date, expected] of [["2025-12-31", false], ["2026-01-01", true], ["2026-12-31", true], ["2027-01-01", false]]) {
    test(`date ${date} vs campaign 2026-01-01..2026-12-31 → eligible=${expected}`, () => {
      assert.equal(evaluateRule(makeRule(), makeContext({ date })).eligible, expected);
    });
  }

  test("reports every failed check, not only the first", () => {
    const result = evaluateRule(makeRule(), makeContext({ country: "PL", currency: "EUR" }));
    assert.deepEqual(result.failedChecks, ["Country allowed", "Currency allowed"]);
    assert.equal(result.bonus, 0);
  });

  test("inactive rule never matches", () => {
    const result = evaluateRule(makeRule({ active: false }), makeContext());
    assert.equal(result.eligible, false);
    assert.deepEqual(result.failedChecks, ["Rule is active"]);
  });

  test("first-deposit-only rule rejects repeat deposit", () => {
    const result = evaluateRule(makeRule({ firstDepositOnly: true }), makeContext({ isFirstDeposit: false }));
    assert.deepEqual(result.failedChecks, ["Deposit type"]);
  });

  test("rounds bonus to cents", () => {
    const result = evaluateRule(makeRule({ percent: 33 }), makeContext({ amount: 100.1 }));
    assert.equal(result.bonus, 33.03);
  });
});

describe("evaluateAll", () => {
  test("lowest priority number wins when several rules match", () => {
    const config = { rules: [makeRule({ id: "B", priority: 2, percent: 200 }), makeRule({ id: "A", priority: 1, percent: 10 })] };
    const outcome = evaluateAll(config, makeContext());
    assert.equal(outcome.bestOffer.ruleId, "A");
    assert.deepEqual(outcome.results.map((r) => r.ruleId), ["A", "B"]);
  });

  test("returns no offer when nothing matches", () => {
    const outcome = evaluateAll({ rules: [makeRule()] }, makeContext({ country: "US" }));
    assert.equal(outcome.bestOffer, null);
  });

  test("does not mutate the config", () => {
    const config = { rules: [makeRule({ id: "B", priority: 2 }), makeRule({ id: "A", priority: 1 })] };
    evaluateAll(config, makeContext());
    assert.deepEqual(config.rules.map((r) => r.id), ["B", "A"]);
  });

  test("stops on invalid input and returns readable errors", () => {
    const outcome = evaluateAll({ rules: [makeRule()] }, makeContext({ amount: -5, date: "2026-02-30" }));
    assert.equal(outcome.results.length, 0);
    assert.equal(outcome.inputErrors.length, 2);
  });
});

describe("validateContext / isValidIsoDate", () => {
  test("accepts a correct context", () => {
    assert.deepEqual(validateContext(makeContext()), []);
  });

  test("rejects lowercase country, NaN amount and missing flag", () => {
    const errors = validateContext({ country: "ua", currency: "UAH", amount: NaN, date: "2026-01-01" });
    assert.equal(errors.length, 3);
  });

  test("rejects impossible dates", () => {
    assert.equal(isValidIsoDate("2026-02-30"), false);
    assert.equal(isValidIsoDate("2026-13-01"), false);
    assert.equal(isValidIsoDate("2028-02-29"), true);
  });
});
