import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { validateConfig, parseAndValidate } from "../js/validator.js";
import { makeRule, loadConfig } from "./helpers.js";

const TODAY = "2026-11-18";
const configWith = (...rules) => ({ version: "1.0.0", rules });
const paths = (result) => result.errors.map((e) => e.path);

describe("validateConfig", () => {
  test("shipped staging and production configs are valid", () => {
    for (const env of ["staging", "production"]) {
      const result = validateConfig(loadConfig(env), TODAY);
      assert.equal(result.valid, true, `${env}: ${JSON.stringify(result.errors)}`);
    }
  });

  test("detects duplicate rule ids", () => {
    const result = validateConfig(configWith(makeRule({ id: "A" }), makeRule({ id: "A", priority: 2 })), TODAY);
    assert.deepEqual(paths(result), ["rules[1].id"]);
  });

  test("detects validTo earlier than validFrom", () => {
    const result = validateConfig(configWith(makeRule({ validFrom: "2026-05-01", validTo: "2026-04-01" })), TODAY);
    assert.deepEqual(paths(result), ["rules[0].validTo"]);
  });

  test("detects wrong types and ranges", () => {
    const bad = makeRule({ minDeposit: "100", percent: 900, wagering: 2.5, countries: ["ukr"], currencies: [], active: "yes" });
    const result = validateConfig(configWith(bad), TODAY);
    assert.deepEqual(paths(result).sort(), [
      "rules[0].active", "rules[0].countries[0]", "rules[0].currencies",
      "rules[0].minDeposit", "rules[0].percent", "rules[0].wagering",
    ]);
  });

  test("rejects a bad version and a non-list rules field", () => {
    const result = validateConfig({ version: "v2", rules: {} }, TODAY);
    assert.deepEqual(paths(result), ["version", "rules"]);
  });

  test("warns about active expired rules and shared priorities", () => {
    const result = validateConfig(configWith(
      makeRule({ id: "OLD", validFrom: "2025-01-01", validTo: "2025-12-31" }),
      makeRule({ id: "NEW", priority: 1 })), TODAY);
    assert.equal(result.valid, true);
    assert.equal(result.warnings.length, 2);
  });

  test("does not warn about inactive expired rules", () => {
    const result = validateConfig(configWith(makeRule({ active: false, validFrom: "2025-01-01", validTo: "2025-12-31" })), TODAY);
    assert.equal(result.warnings.length, 0);
  });
});

describe("parseAndValidate", () => {
  test("turns broken JSON into a readable error", () => {
    const result = parseAndValidate('{ "version": "1.0.0", "rules": [ }', TODAY);
    assert.equal(result.valid, false);
    assert.match(result.errors[0].message, /^Invalid JSON/);
  });

  test("returns the parsed config when valid", () => {
    const result = parseAndValidate(JSON.stringify(configWith(makeRule())), TODAY);
    assert.equal(result.valid, true);
    assert.equal(result.config.rules[0].id, "TEST_RULE");
  });
});
