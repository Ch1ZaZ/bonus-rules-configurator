/**
 * Smoke test suite for release v1.3.0. Run before a release (on staging)
 * and right after it (on production) to confirm key scenarios still work.
 */
import { evaluateAll } from "./engine.js";

export const SMOKE_CASES = [
  {
    id: "S-01", title: "UA first deposit gets welcome bonus",
    input: { country: "UA", currency: "UAH", amount: 1000, date: "2026-11-18", isFirstDeposit: true },
    expected: { ruleId: "WELCOME_UA", bonus: 1000 },
  },
  {
    id: "S-02", title: "UA deposit just below minimum gets nothing",
    input: { country: "UA", currency: "UAH", amount: 199.99, date: "2026-11-18", isFirstDeposit: true },
    expected: { ruleId: null, bonus: 0 },
  },
  {
    id: "S-03", title: "EU welcome bonus capped at new max 300",
    input: { country: "PL", currency: "EUR", amount: 400, date: "2026-11-18", isFirstDeposit: true },
    expected: { ruleId: "WELCOME_EU", bonus: 300 },
  },
  {
    id: "S-04", title: "High roller has priority over welcome bonus",
    input: { country: "DE", currency: "EUR", amount: 600, date: "2026-11-18", isFirstDeposit: true },
    expected: { ruleId: "HIGHROLLER_EU", bonus: 150 },
  },
  {
    id: "S-05", title: "EU repeat deposit gets reload bonus",
    input: { country: "LT", currency: "EUR", amount: 50, date: "2026-11-18", isFirstDeposit: false },
    expected: { ruleId: "RELOAD_EU", bonus: 25 },
  },
  {
    id: "S-06", title: "Winter reload works in December",
    input: { country: "UA", currency: "UAH", amount: 1000, date: "2026-12-05", isFirstDeposit: false },
    expected: { ruleId: "WINTER_RELOAD_UA", bonus: 500 },
  },
  {
    id: "S-07", title: "Winter reload not available before start date",
    input: { country: "UA", currency: "UAH", amount: 1000, date: "2026-11-30", isFirstDeposit: false },
    expected: { ruleId: null, bonus: 0 },
  },
  {
    id: "S-08", title: "Unsupported country and currency get nothing",
    input: { country: "US", currency: "USD", amount: 100, date: "2026-11-18", isFirstDeposit: true },
    expected: { ruleId: null, bonus: 0 },
  },
  {
    id: "S-09", title: "EU reload expired after 2026-12-31",
    input: { country: "PL", currency: "EUR", amount: 100, date: "2027-01-05", isFirstDeposit: false },
    expected: { ruleId: null, bonus: 0 },
  },
];

export function runSmokeSuite(config, cases = SMOKE_CASES) {
  const results = cases.map((testCase) => {
    const { bestOffer } = evaluateAll(config, testCase.input);
    const actual = { ruleId: bestOffer?.ruleId ?? null, bonus: bestOffer?.bonus ?? 0 };
    const passed = actual.ruleId === testCase.expected.ruleId && actual.bonus === testCase.expected.bonus;
    return { ...testCase, actual, passed };
  });
  return {
    results,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
  };
}
