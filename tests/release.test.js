import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { diffConfigs } from "../js/diff.js";
import { runSmokeSuite } from "../js/smoke.js";
import { loadConfig } from "./helpers.js";

const production = loadConfig("production");
const staging = loadConfig("staging");

describe("diffConfigs (release 1.2.0 → 1.3.0)", () => {
  const diff = diffConfigs(production, staging);

  test("finds the new winter reload rule", () => {
    assert.deepEqual(diff.added.map((r) => r.id), ["WINTER_RELOAD_UA"]);
  });

  test("finds the removed Black Friday rule", () => {
    assert.deepEqual(diff.removed.map((r) => r.id), ["BLACK_FRIDAY_2025"]);
  });

  test("finds the changed EU welcome cap", () => {
    assert.deepEqual(diff.changed, [{
      id: "WELCOME_EU", name: "Welcome bonus 100% (EU)",
      fields: [{ field: "maxBonus", from: 200, to: 300 }],
    }]);
    assert.equal(diff.unchanged, 3);
  });

  test("identical configs have no changes", () => {
    assert.equal(diffConfigs(staging, staging).hasChanges, false);
  });
});

describe("smoke suite", () => {
  test("all smoke cases pass on staging (release candidate)", () => {
    const suite = runSmokeSuite(staging);
    const failed = suite.results.filter((r) => !r.passed).map((r) => r.id);
    assert.deepEqual(failed, []);
  });

  test("production before release fails exactly the cases covering new changes", () => {
    const suite = runSmokeSuite(production);
    const failed = suite.results.filter((r) => !r.passed).map((r) => r.id);
    assert.deepEqual(failed, ["S-03", "S-06"]);
  });
});
