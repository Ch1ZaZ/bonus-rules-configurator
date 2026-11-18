/**
 * Config validator: the "safety net" that runs before a config is used
 * or released. Errors block a release, warnings only need attention.
 */
import { isValidIsoDate } from "./engine.js";

const RULE_ID_PATTERN = /^[A-Z0-9_]+$/;
const COUNTRY_PATTERN = /^[A-Z]{2}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MAX_PERCENT = 500;
const MAX_WAGERING = 100;

const isPositiveNumber = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

function validateCodeList(list, pattern, label, path, errors) {
  if (!Array.isArray(list) || list.length === 0) {
    errors.push({ path, message: `${label} must be a non-empty list` });
    return;
  }
  list.forEach((code, i) => {
    if (typeof code !== "string" || !pattern.test(code)) {
      errors.push({ path: `${path}[${i}]`, message: `"${code}" is not a valid ${label.toLowerCase()} code` });
    }
  });
}

function validateRule(rule, path, errors) {
  if (!rule || typeof rule !== "object") {
    errors.push({ path, message: "Rule must be an object" });
    return;
  }
  if (typeof rule.id !== "string" || !RULE_ID_PATTERN.test(rule.id)) {
    errors.push({ path: `${path}.id`, message: "id must use only A-Z, 0-9 and _" });
  }
  if (typeof rule.name !== "string" || rule.name.trim() === "") {
    errors.push({ path: `${path}.name`, message: "name is required" });
  }
  if (typeof rule.active !== "boolean") {
    errors.push({ path: `${path}.active`, message: "active must be true or false" });
  }
  if (!Number.isInteger(rule.priority) || rule.priority < 1) {
    errors.push({ path: `${path}.priority`, message: "priority must be a whole number >= 1" });
  }
  validateCodeList(rule.countries, COUNTRY_PATTERN, "Country", `${path}.countries`, errors);
  validateCodeList(rule.currencies, CURRENCY_PATTERN, "Currency", `${path}.currencies`, errors);
  if (!isPositiveNumber(rule.minDeposit)) {
    errors.push({ path: `${path}.minDeposit`, message: "minDeposit must be a number > 0" });
  }
  if (!isPositiveNumber(rule.maxBonus)) {
    errors.push({ path: `${path}.maxBonus`, message: "maxBonus must be a number > 0" });
  }
  if (!isPositiveNumber(rule.percent) || rule.percent > MAX_PERCENT) {
    errors.push({ path: `${path}.percent`, message: `percent must be between 1 and ${MAX_PERCENT}` });
  }
  if (!Number.isInteger(rule.wagering) || rule.wagering < 0 || rule.wagering > MAX_WAGERING) {
    errors.push({ path: `${path}.wagering`, message: `wagering must be a whole number 0-${MAX_WAGERING}` });
  }
  if (typeof rule.firstDepositOnly !== "boolean") {
    errors.push({ path: `${path}.firstDepositOnly`, message: "firstDepositOnly must be true or false" });
  }
  const fromOk = isValidIsoDate(rule.validFrom);
  const toOk = isValidIsoDate(rule.validTo);
  if (!fromOk) errors.push({ path: `${path}.validFrom`, message: "validFrom must be YYYY-MM-DD" });
  if (!toOk) errors.push({ path: `${path}.validTo`, message: "validTo must be YYYY-MM-DD" });
  if (fromOk && toOk && rule.validFrom > rule.validTo) {
    errors.push({ path: `${path}.validTo`, message: "validTo is earlier than validFrom" });
  }
}

function collectWarnings(rules, today) {
  const warnings = [];
  const priorities = new Map();
  rules.forEach((rule, i) => {
    if (rule.active && isValidIsoDate(rule.validTo) && rule.validTo < today) {
      warnings.push({ path: `rules[${i}]`, message: `${rule.id} is active but expired on ${rule.validTo}` });
    }
    if (Number.isInteger(rule.priority)) {
      priorities.set(rule.priority, [...(priorities.get(rule.priority) ?? []), rule.id]);
    }
  });
  priorities.forEach((ids, priority) => {
    if (ids.length > 1) {
      warnings.push({ path: "rules", message: `Priority ${priority} is shared by ${ids.join(", ")}` });
    }
  });
  return warnings;
}

/**
 * @param {unknown} config parsed JSON
 * @param {string} today date in YYYY-MM-DD, used for expiry warnings
 */
export function validateConfig(config, today) {
  const errors = [];
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return { valid: false, errors: [{ path: "$", message: "Config must be a JSON object" }], warnings: [] };
  }
  if (typeof config.version !== "string" || !/^\d+\.\d+\.\d+$/.test(config.version)) {
    errors.push({ path: "version", message: "version must look like 1.2.0" });
  }
  if (!Array.isArray(config.rules)) {
    errors.push({ path: "rules", message: "rules must be a list" });
    return { valid: false, errors, warnings: [] };
  }

  config.rules.forEach((rule, i) => validateRule(rule, `rules[${i}]`, errors));

  const seen = new Set();
  config.rules.forEach((rule, i) => {
    if (rule && seen.has(rule.id)) {
      errors.push({ path: `rules[${i}].id`, message: `Duplicate id ${rule.id}` });
    }
    if (rule) seen.add(rule.id);
  });

  const warnings = errors.length === 0 ? collectWarnings(config.rules, today) : [];
  return { valid: errors.length === 0, errors, warnings };
}

/** Parses raw JSON text and validates it, turning syntax errors into readable messages. */
export function parseAndValidate(text, today) {
  let config;
  try {
    config = JSON.parse(text);
  } catch (error) {
    return { config: null, valid: false, errors: [{ path: "$", message: `Invalid JSON: ${error.message}` }], warnings: [] };
  }
  return { config, ...validateConfig(config, today) };
}
