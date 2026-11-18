import { evaluateAll } from "./engine.js";
import { validateConfig, parseAndValidate } from "./validator.js";
import { diffConfigs } from "./diff.js";
import { runSmokeSuite } from "./smoke.js";
import { el, renderEvaluation, renderValidation, renderGate, renderDiff, renderSmoke } from "./render.js";

const ENVIRONMENTS = ["staging", "production"];
const today = () => new Date().toISOString().slice(0, 10);
const $ = (selector) => document.querySelector(selector);

const state = {
  env: "staging",
  files: {},   // configs exactly as loaded from config/*.json
  current: {}, // configs used in this session (may be edited or released)
  log: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

async function loadConfigs() {
  const loaded = await Promise.all(ENVIRONMENTS.map(async (env) => {
    const response = await fetch(`config/${env}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`config/${env}.json: HTTP ${response.status}`);
    return [env, await response.json()];
  }));
  state.files = Object.fromEntries(loaded);
  state.current = clone(state.files);
}

function addLog(message) {
  state.log = [...state.log, `${new Date().toLocaleTimeString()} — ${message}`];
  $("#release-log").replaceChildren(...state.log.map((line) => el("li", {}, line)));
}

function refreshHeader() {
  $("#env-select").value = state.env;
  $("#env-version").textContent = `v${state.current[state.env].version}`;
  document.body.dataset.env = state.env;
  $("#config-env-label").textContent = `${state.env} (v${state.current[state.env].version})`;
}

function readForm() {
  const data = new FormData($("#eval-form"));
  return {
    country: data.get("country"),
    currency: data.get("currency"),
    amount: data.get("amount") === "" ? NaN : Number(data.get("amount")),
    date: data.get("date"),
    isFirstDeposit: data.get("isFirstDeposit") === "on",
  };
}

function runEvaluation() {
  const context = readForm();
  const outcome = evaluateAll(state.current[state.env], context);
  $("#eval-output").replaceChildren(renderEvaluation(outcome, context));
}

function loadEditor() {
  $("#config-editor").value = JSON.stringify(state.current[state.env], null, 2);
  $("#validation-output").replaceChildren();
}

function validateEditor() {
  const result = parseAndValidate($("#config-editor").value, today());
  $("#validation-output").replaceChildren(renderValidation(result));
  return result;
}

function applyEditor() {
  const result = validateEditor();
  if (!result.valid) return;
  state.current = { ...state.current, [state.env]: result.config };
  addLog(`Applied edited ${state.env} config v${result.config.version} (session only)`);
  refreshAll();
  $("#validation-output").replaceChildren(renderValidation(result));
}

function releaseGate() {
  const staging = state.current.staging;
  const validation = validateConfig(staging, today());
  const diff = diffConfigs(state.current.production, staging);
  const smoke = runSmokeSuite(staging);
  const reasons = [
    validation.valid ? "Staging config is valid" : `Staging config has ${validation.errors.length} validation error(s)`,
    diff.hasChanges ? "There are changes to release" : "Nothing to release — configs are identical",
    smoke.failed === 0 ? `Smoke tests on staging: ${smoke.passed}/${smoke.results.length} passed` : `Smoke tests on staging: ${smoke.failed} failed`,
  ];
  return { ready: validation.valid && diff.hasChanges && smoke.failed === 0, reasons, diff };
}

function refreshRelease() {
  const gate = releaseGate();
  $("#release-gate").replaceChildren(renderGate(gate));
  $("#diff-output").replaceChildren(renderDiff(gate.diff));
  $("#btn-release").disabled = !gate.ready;
}

function release() {
  const gate = releaseGate();
  if (!gate.ready) return;
  const from = state.current.production.version;
  state.current = { ...state.current, production: { ...clone(state.current.staging), environment: "production" } };
  addLog(`Released v${state.current.production.version} to production (was v${from}). Next step: run smoke tests on production.`);
  refreshAll();
}

function runSmoke(env) {
  const suite = runSmokeSuite(state.current[env]);
  $("#smoke-output").replaceChildren(renderSmoke(env, suite));
  addLog(`Smoke tests on ${env} v${state.current[env].version}: ${suite.passed} passed, ${suite.failed} failed`);
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((tab) => {
    const active = tab.dataset.tab === name;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll(".panel").forEach((panel) => { panel.hidden = panel.id !== `tab-${name}`; });
}

function refreshAll() {
  refreshHeader();
  loadEditor();
  runEvaluation();
  refreshRelease();
}

function bindEvents() {
  $("#env-select").addEventListener("change", (e) => { state.env = e.target.value; refreshAll(); });
  $("#eval-form").addEventListener("submit", (e) => { e.preventDefault(); runEvaluation(); });
  $("#btn-validate").addEventListener("click", validateEditor);
  $("#btn-apply").addEventListener("click", applyEditor);
  $("#btn-reset").addEventListener("click", () => {
    state.current = { ...state.current, [state.env]: clone(state.files[state.env]) };
    addLog(`Reset ${state.env} config to file version`);
    refreshAll();
  });
  $("#btn-release").addEventListener("click", release);
  document.querySelectorAll("[data-smoke]").forEach((btn) => btn.addEventListener("click", () => runSmoke(btn.dataset.smoke)));
  document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
}

async function init() {
  $("#eval-form").elements.date.value = today();
  try {
    await loadConfigs();
  } catch (error) {
    $("main").prepend(el("div", { class: "card alert error" },
      el("strong", {}, "Could not load configs. "),
      `${error.message}. Open the app through a web server (npm start), not as a file.`));
    return;
  }
  bindEvents();
  refreshAll();
}

init();
