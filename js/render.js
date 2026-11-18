/**
 * DOM builders. Everything is created with textContent (never innerHTML
 * with data), so text typed into the config editor cannot inject HTML.
 */

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === "class") node.className = value;
    else node.setAttribute(key, value);
  });
  children.flat().forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

const fmt = (n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
const show = (v) => (Array.isArray(v) ? v.join(", ") : String(v));

export function renderEvaluation(outcome, context) {
  if (outcome.inputErrors.length > 0) {
    return el("div", { class: "card alert error" },
      el("strong", {}, "Input is not valid"),
      el("ul", {}, outcome.inputErrors.map((e) => el("li", {}, e))));
  }

  const best = outcome.bestOffer;
  const summary = best
    ? el("div", { class: "card result ok" },
        el("div", { class: "label" }, "Bonus granted"),
        el("div", { class: "big" }, `${fmt(best.bonus)} ${context.currency}`),
        el("div", {}, `${best.name} (${best.ruleId}) · wagering requirement ${fmt(best.wageringRequirement)} ${context.currency}`))
    : el("div", { class: "card result none" },
        el("div", { class: "label" }, "No bonus"),
        el("div", {}, "No rule matched this deposit. Open the rules below to see which check failed."));

  const rows = outcome.results.map((r) =>
    el("details", { class: `rule ${r.eligible ? "pass" : "fail"}`, ...(r === best ? { open: "" } : {}) },
      el("summary", {},
        el("span", { class: "badge" }, r.eligible ? "MATCH" : "NO MATCH"),
        el("span", { class: "rule-name" }, `#${r.priority} ${r.name}`),
        el("code", {}, r.ruleId),
        r.eligible ? null : el("span", { class: "muted" }, `failed: ${r.failedChecks.join(", ")}`)),
      el("table", { class: "checks" },
        el("thead", {}, el("tr", {}, el("th", {}, "Check"), el("th", {}, "Expected"), el("th", {}, "Actual"), el("th", {}, "Result"))),
        el("tbody", {}, r.checks.map((c) =>
          el("tr", { class: c.passed ? "pass" : "fail" },
            el("td", {}, c.name), el("td", {}, c.expected), el("td", {}, c.actual),
            el("td", {}, c.passed ? "✔ pass" : "✘ fail")))))));

  return el("div", {}, summary, el("h3", {}, "Rule trace (in priority order)"), rows);
}

export function renderValidation(result) {
  if (!result.valid) {
    return el("div", { class: "card alert error" },
      el("strong", {}, `✘ ${result.errors.length} error(s) — config cannot be used`),
      el("ul", {}, result.errors.map((e) => el("li", {}, el("code", {}, e.path), ` ${e.message}`))));
  }
  return el("div", { class: `card alert ${result.warnings.length ? "warn" : "success"}` },
    el("strong", {}, result.warnings.length ? `✔ Valid with ${result.warnings.length} warning(s)` : "✔ Config is valid"),
    result.warnings.length ? el("ul", {}, result.warnings.map((w) => el("li", {}, el("code", {}, w.path), ` ${w.message}`))) : null);
}

export function renderGate(gate) {
  return el("div", { class: `alert ${gate.ready ? "success" : "warn"}` },
    el("strong", {}, gate.ready ? "✔ Ready for release" : gate.diff.hasChanges ? "✘ Release blocked" : "Nothing to release"),
    el("ul", {}, gate.reasons.map((r) => el("li", {}, r))));
}

export function renderDiff(diff) {
  if (!diff.hasChanges) {
    return el("p", { class: "muted" }, `No differences: production already runs v${diff.toVersion}.`);
  }
  const ruleLine = (r) => el("li", {}, el("code", {}, r.id), ` ${r.name}`);
  return el("div", { class: "diff" },
    el("p", {}, `Version ${diff.fromVersion} → ${diff.toVersion} · ${diff.unchanged} rule(s) unchanged`),
    diff.added.length ? el("div", { class: "diff-block added" }, el("h4", {}, `+ Added (${diff.added.length})`), el("ul", {}, diff.added.map(ruleLine))) : null,
    diff.removed.length ? el("div", { class: "diff-block removed" }, el("h4", {}, `− Removed (${diff.removed.length})`), el("ul", {}, diff.removed.map(ruleLine))) : null,
    diff.changed.length ? el("div", { class: "diff-block changed" }, el("h4", {}, `~ Changed (${diff.changed.length})`),
      el("ul", {}, diff.changed.map((c) => el("li", {}, el("code", {}, c.id),
        el("ul", {}, c.fields.map((f) => el("li", {}, `${f.field}: `, el("del", {}, show(f.from)), " → ", el("ins", {}, show(f.to))))))))) : null);
}

export function renderSmoke(env, suite) {
  return el("div", {},
    el("p", { class: suite.failed ? "fail-text" : "pass-text" },
      `${env}: ${suite.passed} passed, ${suite.failed} failed`),
    el("table", { class: "checks" },
      el("thead", {}, el("tr", {}, el("th", {}, "ID"), el("th", {}, "Scenario"), el("th", {}, "Expected"), el("th", {}, "Actual"), el("th", {}, "Status"))),
      el("tbody", {}, suite.results.map((r) =>
        el("tr", { class: r.passed ? "pass" : "fail" },
          el("td", {}, r.id), el("td", {}, r.title),
          el("td", {}, `${r.expected.ruleId ?? "none"} / ${r.expected.bonus}`),
          el("td", {}, `${r.actual.ruleId ?? "none"} / ${r.actual.bonus}`),
          el("td", {}, r.passed ? "✔ PASS" : "✘ FAIL"))))));
}
