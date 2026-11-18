# Bonus Rules Configurator

[![tests](https://github.com/Ch1ZaZ/bonus-rules-configurator/actions/workflows/tests.yml/badge.svg)](https://github.com/Ch1ZaZ/bonus-rules-configurator/actions/workflows/tests.yml)

**Live demo:** https://ch1zaz.github.io/bonus-rules-configurator/

A small web app that shows how a platform can be **configured instead of coded**.
Promotion (bonus) rules for an online gaming / payments platform live in JSON config
files. The app evaluates a player's deposit against those rules, validates config
changes and walks a change through a **staging → production release** with smoke
tests before and after the release.

The goal of the project is to practise the daily work of a configuration specialist:
turning business requirements into configuration, testing it on staging, releasing it
safely and documenting every change.

## Features

| Tab | What it does |
|---|---|
| **1. Evaluate deposit** | Enter country, currency, amount, date and first-deposit flag. The app shows the granted bonus and a **rule trace**: every rule, every check, expected vs actual value. This is how you answer a support ticket like *"why didn't the player get a bonus?"* |
| **2. Edit & validate config** | Edit the active environment's rules as JSON. A validator blocks broken configs (wrong types, duplicate ids, invalid dates, out-of-range values) and warns about risky ones (expired active rule, shared priority). |
| **3. Release & smoke tests** | Diff between production and staging (added / removed / changed rules), a release gate (valid config + changes + green smoke tests), a simulated release and a 9-case smoke suite to run before and after it. |

The environment switch in the header turns the bar **orange for staging** and
**red for production**, so it is always clear where you are working.

## How the rules work

```json
{
  "id": "WELCOME_EU",
  "name": "Welcome bonus 100% (EU)",
  "active": true,
  "priority": 3,
  "countries": ["PL", "DE", "LT", "LV", "EE", "CZ"],
  "currencies": ["EUR"],
  "minDeposit": 20,
  "maxBonus": 300,
  "percent": 100,
  "wagering": 30,
  "firstDepositOnly": true,
  "validFrom": "2026-01-01",
  "validTo": "2026-12-31"
}
```

- A rule matches when **all** its checks pass: active, country, currency, minimum deposit, start date, end date, deposit type.
- Bonus = `min(amount × percent / 100, maxBonus)`, rounded to cents.
- Wagering requirement = `bonus × wagering`.
- Only **one** bonus per deposit: the matching rule with the **lowest priority number** wins.

Full field reference: [docs/CONFIG-REFERENCE.md](docs/CONFIG-REFERENCE.md).

## Release 1.2.0 → 1.3.0 (included as a worked example)

| Change | Rule |
|---|---|
| Added | `WINTER_RELOAD_UA` — 50% reload for Ukraine, 1 Dec 2026 – 28 Feb 2027 |
| Changed | `WELCOME_EU` — `maxBonus` 200 → 300 EUR |
| Removed | `BLACK_FRIDAY_2025` — expired, inactive campaign |

See [CHANGELOG.md](CHANGELOG.md) and the [release checklist](docs/RELEASE-CHECKLIST.md).

## Testing

- **35 automated unit tests** (Node built-in test runner, no dependencies): rule logic,
  boundary values (deposit 99.99 / 100 / 100.01, first/last campaign day), validator
  errors, release diff and the smoke suite against both configs.
- **GitHub Actions** runs the tests on every push.
- **Manual test cases** with results: [docs/TEST-CASES.md](docs/TEST-CASES.md).

```bash
npm test     # run unit tests
npm start    # open http://localhost:8080
```

Requires Node.js 22 or newer.

> Configs are loaded with `fetch`, so open the app through `npm start` (or GitHub Pages),
> not by double-clicking `index.html`.

## Project structure

```
config/            staging.json, production.json — the source of truth
js/engine.js       rule evaluation (pure functions)
js/validator.js    config validation: errors and warnings
js/diff.js         staging vs production comparison
js/smoke.js        smoke test suite for release 1.3.0
js/render.js       DOM rendering (textContent only, no innerHTML)
js/app.js          UI state and events
tests/             unit tests (node --test)
docs/              config reference, test cases, release checklist
```

## Tech

JavaScript (ES modules) · HTML · CSS · JSON · Node.js test runner · GitHub Actions · GitHub Pages

All rules, amounts and campaigns are fictional.
