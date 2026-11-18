/**
 * Rule engine: decides which bonus rules a player is eligible for.
 * Pure functions only — no DOM access — so the same code runs in the
 * browser and in the Node test runner.
 */

const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

/** Validates the player/deposit input before any rule is evaluated. */
export function validateContext(context) {
  const errors = [];
  if (!context || typeof context !== "object") {
    return ["Input is missing"];
  }
  if (!COUNTRY_PATTERN.test(context.country ?? "")) {
    errors.push("Country must be a 2-letter ISO code, e.g. UA");
  }
  if (!CURRENCY_PATTERN.test(context.currency ?? "")) {
    errors.push("Currency must be a 3-letter ISO code, e.g. EUR");
  }
  if (typeof context.amount !== "number" || !Number.isFinite(context.amount) || context.amount <= 0) {
    errors.push("Deposit amount must be a positive number");
  }
  if (!isValidIsoDate(context.date)) {
    errors.push("Date must be a valid date in YYYY-MM-DD format");
  }
  if (typeof context.isFirstDeposit !== "boolean") {
    errors.push("First deposit flag must be true or false");
  }
  return errors;
}

function check(name, passed, expected, actual) {
  return { name, passed, expected, actual };
}

/** Runs every condition of one rule and returns a full trace of the checks. */
export function evaluateRule(rule, context) {
  const checks = [
    check("Rule is active", rule.active === true, "active", rule.active ? "active" : "inactive"),
    check("Country allowed", rule.countries.includes(context.country), rule.countries.join(", "), context.country),
    check("Currency allowed", rule.currencies.includes(context.currency), rule.currencies.join(", "), context.currency),
    check("Minimum deposit", context.amount >= rule.minDeposit, `>= ${rule.minDeposit}`, String(context.amount)),
    check("Campaign started", context.date >= rule.validFrom, `from ${rule.validFrom}`, context.date),
    check("Campaign not expired", context.date <= rule.validTo, `until ${rule.validTo}`, context.date),
    check(
      "Deposit type",
      !rule.firstDepositOnly || context.isFirstDeposit,
      rule.firstDepositOnly ? "first deposit only" : "any deposit",
      context.isFirstDeposit ? "first deposit" : "repeat deposit"
    ),
  ];

  const eligible = checks.every((c) => c.passed);
  const bonus = eligible ? roundMoney(Math.min((context.amount * rule.percent) / 100, rule.maxBonus)) : 0;

  return {
    ruleId: rule.id,
    name: rule.name,
    priority: rule.priority,
    eligible,
    checks,
    failedChecks: checks.filter((c) => !c.passed).map((c) => c.name),
    bonus,
    wageringRequirement: roundMoney(bonus * rule.wagering),
  };
}

/**
 * Evaluates all rules of a config. Only one bonus is granted per deposit:
 * the eligible rule with the lowest priority number wins.
 */
export function evaluateAll(config, context) {
  const inputErrors = validateContext(context);
  if (inputErrors.length > 0) {
    return { inputErrors, results: [], bestOffer: null };
  }

  const results = [...config.rules]
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .map((rule) => evaluateRule(rule, context));

  const bestOffer = results.find((r) => r.eligible) ?? null;
  return { inputErrors: [], results, bestOffer };
}
