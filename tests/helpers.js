import { readFileSync } from "node:fs";

export function loadConfig(env) {
  const url = new URL(`../config/${env}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

export function makeRule(overrides = {}) {
  return {
    id: "TEST_RULE",
    name: "Test rule",
    active: true,
    priority: 1,
    countries: ["UA"],
    currencies: ["UAH"],
    minDeposit: 100,
    maxBonus: 500,
    percent: 100,
    wagering: 30,
    firstDepositOnly: false,
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    ...overrides,
  };
}

export function makeContext(overrides = {}) {
  return {
    country: "UA",
    currency: "UAH",
    amount: 200,
    date: "2026-06-15",
    isFirstDeposit: true,
    ...overrides,
  };
}
