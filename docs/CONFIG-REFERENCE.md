# Config reference

Each environment has one file in `config/`. The file is a JSON object:

| Field | Type | Example | Notes |
|---|---|---|---|
| `environment` | string | `"staging"` | informational |
| `version` | string | `"1.3.0"` | required, `MAJOR.MINOR.PATCH` |
| `updatedAt` | string | `"2026-11-18"` | informational |
| `rules` | list | | required, see below |

## Rule fields

| Field | Type | Allowed values | Meaning |
|---|---|---|---|
| `id` | string | `A-Z`, `0-9`, `_`; unique | technical name, used in logs and tickets |
| `name` | string | not empty | name shown to support / marketing |
| `active` | boolean | `true` / `false` | switch a rule off without deleting it |
| `priority` | integer | ≥ 1 | lower number wins when several rules match |
| `countries` | list | 2-letter ISO codes (`UA`, `PL`) | player country must be in the list |
| `currencies` | list | 3-letter ISO codes (`UAH`, `EUR`) | deposit currency must be in the list |
| `minDeposit` | number | > 0 | in the deposit currency; equal amount qualifies |
| `maxBonus` | number | > 0 | bonus cap |
| `percent` | number | 1 – 500 | bonus = amount × percent / 100 |
| `wagering` | integer | 0 – 100 | turnover multiplier before bonus can be withdrawn |
| `firstDepositOnly` | boolean | `true` / `false` | welcome offers use `true` |
| `validFrom` | date | `YYYY-MM-DD` | first day included |
| `validTo` | date | `YYYY-MM-DD`, ≥ `validFrom` | last day included |

## Validator

**Errors** (config cannot be applied or released): missing or wrong-typed field,
value out of range, invalid code or date, `validTo` before `validFrom`, duplicate `id`,
invalid JSON.

**Warnings** (allowed, but check before release): an active rule that has already
expired, two rules with the same priority.

## Typical requests and how to configure them

| Business request | Change |
|---|---|
| "Stop the Black Friday promo now" | `active: false` |
| "Raise the EU welcome cap to 300" | `maxBonus: 300` |
| "Launch the promo in Latvia too" | add `"LV"` to `countries` |
| "Extend the campaign by a week" | move `validTo` |
| "High rollers must not also get the welcome bonus" | give the high roller rule a lower `priority` number |
