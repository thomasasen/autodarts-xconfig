# SonarQube Server Config For autodarts-xconfig

Date: `2026-04-19`
Last verified: `2026-04-24`
Project key: `xConfig`
Project name: `autodarts-xconfig`
JS profile: `autodarts-xconfig JS`

## Applied Live On Server

The following changes were applied directly on the SonarQube server:

- Deactivated `javascript:S2486`
- Deactivated `javascript:S7764`
- Deactivated `javascript:S7785`
- Deactivated `javascript:S7761`
- Deactivated `javascript:S1940`
- Updated `javascript:S3776` to severity `MAJOR` with threshold `25`
- Updated `javascript:S2004` to severity `MAJOR` with max nesting `4`
- Updated `javascript:S6582` to severity `MINOR`
- Confirmed `javascript:S1128` is active
- Confirmed `javascript:S125` is active
- Set `sonar.exclusions` to:
  `dist/**`, `src/legacy-backups/**`, `src/vendors/anime.min.cjs`, `src/vendors/canvas-confetti.browser.js`
- Set `sonar.cpd.exclusions` to:
  `src/vendors/**`, `src/legacy-backups/**`
- Set `sonar.coverage.exclusions` to:
  `loader/**`, `scripts/**`, `src/vendors/**`, `src/legacy-backups/**`
- Assigned quality gate `autodarts-xconfig` to project `xConfig`
- Added new-code quality gate conditions:
  - `new_security_review_rating > 1`
  - `new_blocker_violations > 0`
  - `new_critical_violations > 0`

## Verified Outcome

After a fresh Sonar analysis on `2026-04-24`:

- Quality gate is `OK`
- Open issues are `0`
- Open Security Hotspots to review are `16`
- JS profile active rule count is now `375`
- New-code duplicated lines density is `1.59774`
- New-code Blocker issues are `0`
- New-code Critical issues are `0`
- New-code Security Review Rating is `A`
- Coverage remains `0.0`; no LCOV report is currently imported

## Intentional Non-Changes

The following were intentionally left unchanged:

- New code definition
- CSS profile
- HTML profile

Reason:

- The current gate already focuses on new code.
- Coverage import is still `0.0`, so adding a coverage gate now would create noise rather than value.
- The repository is overwhelmingly JS/MJS. Standalone CSS/HTML analysis is currently marginal for this project.

## Reapply Script

Use [apply-xconfig-server-config.ps1](/c:/Users/thoma/Documents/Development/autodarts-xconfig/ops/sonarqube/apply-xconfig-server-config.ps1) to reapply the same server changes.

Example:

```powershell
$env:SONARQUBE_URL = "http://your-sonarqube-server:9000"
$env:SONARQUBE_TOKEN = "your-token"

.\ops\sonarqube\apply-xconfig-server-config.ps1 -RunAnalysis
```

## Next Sensible Step

Do not add a coverage threshold in SonarQube until coverage reports are actually imported.

When coverage import is ready, the next server-side change should be:

- add `sonar.javascript.lcov.reportPaths`
- then add a new-code coverage condition to the quality gate
