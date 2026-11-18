# Manual test cases

Environment: staging v1.3.0 unless stated otherwise. Browser: Chrome, desktop and 375 px mobile width.
Techniques: positive / negative testing, equivalence partitioning, boundary value analysis.

## Evaluate deposit

| ID | Scenario | Input | Expected | Status |
|---|---|---|---|---|
| TC-01 | UA welcome bonus | UA, UAH, 1000, 2026-11-18, first | WELCOME_UA, 1000 UAH, wagering 35 000 | ✔ Pass |
| TC-02 | Min deposit −0.01 | UA, UAH, 199.99, first | No bonus, failed: Minimum deposit | ✔ Pass |
| TC-03 | Min deposit exact | UA, UAH, 200, first | WELCOME_UA, 200 UAH | ✔ Pass |
| TC-04 | Bonus cap | PL, EUR, 400, first | WELCOME_EU, 300 EUR (capped) | ✔ Pass |
| TC-05 | Priority | DE, EUR, 600, first | HIGHROLLER_EU (priority 1), 150 EUR — not WELCOME_EU | ✔ Pass |
| TC-06 | Repeat deposit on welcome-only rule | UA, UAH, 1000, 2026-11-18, repeat | No bonus, failed: Deposit type | ✔ Pass |
| TC-07 | Campaign not started | UA, UAH, 1000, 2026-11-30, repeat | No bonus, WINTER_RELOAD_UA failed: Campaign started | ✔ Pass |
| TC-08 | Campaign first day | UA, UAH, 1000, 2026-12-01, repeat | WINTER_RELOAD_UA, 500 UAH | ✔ Pass |
| TC-09 | Unsupported currency | PL, USD, 100, first | No bonus, failed: Currency allowed | ✔ Pass |
| TC-10 | Unsupported country | US, USD, 100, first | No bonus, failed: Country, Currency | ✔ Pass |
| TC-11 | Negative amount | UA, UAH, −5 | Input error "Deposit amount must be a positive number" | ✔ Pass |
| TC-12 | Empty amount | UA, UAH, (empty) | Input error, no rule evaluated | ✔ Pass |

## Edit & validate config

| ID | Scenario | Steps | Expected | Status |
|---|---|---|---|---|
| TC-13 | Valid edit | Change WELCOME_UA `maxBonus` to 4000 → Apply | "Config is valid", evaluation uses 4000 cap | ✔ Pass |
| TC-14 | Broken JSON | Delete a closing bracket → Validate | "Invalid JSON …", config not applied | ✔ Pass |
| TC-15 | Negative min deposit | `minDeposit: -5` → Apply | Error on `rules[0].minDeposit`, not applied | ✔ Pass |
| TC-16 | Duplicate id | Copy an id to another rule → Apply | Error "Duplicate id …" | ✔ Pass |
| TC-17 | End before start | `validTo` before `validFrom` → Apply | Error on `validTo` | ✔ Pass |
| TC-18 | HTML in name | `name: "<img src=x onerror=alert(1)>"` | Text shown as plain text, no script runs | ✔ Pass |
| TC-19 | Reset | After edits → Reset to file | Original file config restored | ✔ Pass |

## Release & smoke tests

| ID | Scenario | Steps | Expected | Status |
|---|---|---|---|---|
| TC-20 | Release diff | Open tab 3 | +WINTER_RELOAD_UA, −BLACK_FRIDAY_2025, ~WELCOME_EU maxBonus 200→300 | ✔ Pass |
| TC-21 | Gate blocks invalid staging | Apply invalid staging config | Not possible — invalid configs are never applied | ✔ Pass |
| TC-22 | Smoke before release | Run on production | 7 passed, 2 failed (S-03, S-06) | ✔ Pass |
| TC-23 | Release | Release to production | Production version = 1.3.0, entry in session log | ✔ Pass |
| TC-24 | Smoke after release | Run on production | 9 passed, 0 failed | ✔ Pass |
| TC-25 | Nothing to release | After TC-23 | Gate "Nothing to release", button disabled | ✔ Pass |

## UI

| ID | Scenario | Expected | Status |
|---|---|---|---|
| TC-26 | Environment indicator | Staging = orange bar, Production = red bar, version badge updates | ✔ Pass |
| TC-27 | Mobile 375 px | No horizontal scroll, form in one column | ✔ Pass |
| TC-28 | Opened as file (no server) | Clear error: open through `npm start` | ✔ Pass |
