/**
 * Release diff: shows what will change in production if the staging
 * config is released. "from" = production, "to" = staging.
 */

const RULE_FIELDS = [
  "name", "active", "priority", "countries", "currencies", "minDeposit",
  "maxBonus", "percent", "wagering", "firstDepositOnly", "validFrom", "validTo",
];

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function diffRule(prodRule, stagingRule) {
  return RULE_FIELDS
    .filter((field) => !sameValue(prodRule[field], stagingRule[field]))
    .map((field) => ({ field, from: prodRule[field], to: stagingRule[field] }));
}

export function diffConfigs(production, staging) {
  const prodById = new Map(production.rules.map((r) => [r.id, r]));
  const stagingById = new Map(staging.rules.map((r) => [r.id, r]));

  const added = staging.rules.filter((r) => !prodById.has(r.id));
  const removed = production.rules.filter((r) => !stagingById.has(r.id));
  const changed = [];
  let unchanged = 0;

  staging.rules.forEach((rule) => {
    const prodRule = prodById.get(rule.id);
    if (!prodRule) return;
    const fields = diffRule(prodRule, rule);
    if (fields.length > 0) changed.push({ id: rule.id, name: rule.name, fields });
    else unchanged += 1;
  });

  return {
    fromVersion: production.version,
    toVersion: staging.version,
    added,
    removed,
    changed,
    unchanged,
    hasChanges: added.length + removed.length + changed.length > 0,
  };
}
