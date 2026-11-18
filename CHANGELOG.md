# Changelog

All config changes are recorded here. Versions follow `MAJOR.MINOR.PATCH`:
new or removed rules → MINOR, value fixes → PATCH.

## [1.3.0] — staging, 2026-11-18

Requested by: marketing (winter campaign) and CRM team (EU welcome cap).

### Added
- `WINTER_RELOAD_UA` — 50% reload bonus for Ukraine, min deposit 500 UAH,
  max bonus 2000 UAH, wagering x30, valid 2026-12-01 … 2027-02-28, priority 4.

### Changed
- `WELCOME_EU` — `maxBonus` 200 → 300 EUR.

### Removed
- `BLACK_FRIDAY_2025` — campaign ended 2025-11-30, rule was already inactive.

### Verification
- Validator: 0 errors, 0 warnings.
- Smoke tests on staging: 9/9 passed.
- Smoke tests on production before release: 7/9 — S-03 and S-06 fail as expected
  (they cover the new changes). Must be 9/9 after release.

## [1.2.0] — production, 2026-11-02

### Added
- `HIGHROLLER_EU` — 25% bonus for deposits from 500 EUR, priority 1.
- `RELOAD_EU` — 50% reload bonus for EU repeat deposits.

### Changed
- `BLACK_FRIDAY_2025` — set `active: false` after the campaign ended.
