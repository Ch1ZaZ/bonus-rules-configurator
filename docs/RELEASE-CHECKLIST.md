# Release checklist

Used for every config release from staging to production.

## Before release (staging)

- [ ] Change is described in `CHANGELOG.md`: what, why, who requested it
- [ ] Version number increased in `config/staging.json`
- [ ] Validator: 0 errors; every warning reviewed and explained
- [ ] Release diff shows **only** the expected added / changed / removed rules
- [ ] New and changed rules covered by test cases (positive, negative, boundary values)
- [ ] Smoke tests on staging: all passed
- [ ] Unit tests (`npm test`) green in GitHub Actions

## Release

- [ ] Environment switch shows **Production** (red bar) before touching anything
- [ ] Release done, version on production = staging version
- [ ] Release time noted in the change log

## After release (production)

- [ ] Smoke tests on production: all passed
- [ ] Spot-check 1–2 real scenarios from the change request in the Evaluate tab
- [ ] Support team informed about the new / changed bonus rules
- [ ] If anything fails: roll back to the previous production config and open an incident

## Release 1.3.0 — result (2026-11-18, demo)

| Step | Result |
|---|---|
| Validator on staging | 0 errors, 0 warnings |
| Diff | +1 added, ~1 changed, −1 removed, 3 unchanged |
| Smoke on staging | 9/9 passed |
| Smoke on production before release | 7/9 (S-03, S-06 fail — expected, they cover the new changes) |
| Smoke on production after release | 9/9 passed |
