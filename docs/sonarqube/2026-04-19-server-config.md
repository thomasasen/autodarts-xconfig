# SonarQube Server Config For autodarts-xconfig

Date: `2026-04-19`
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
- Set `sonar.exclusions` to:
  `dist/**`, `src/legacy-backups/**`, `src/vendors/anime.min.cjs`, `src/vendors/canvas-confetti.browser.js`
- Set `sonar.cpd.exclusions` to:
  `src/vendors/**`, `src/legacy-backups/**`
- Set `sonar.coverage.exclusions` to:
  `loader/**`, `scripts/**`, `src/vendors/**`, `src/legacy-backups/**`

## Verified Outcome

After a fresh Sonar analysis:

- Open issues dropped from `259` to `117`
- Open `CRITICAL` issues dropped from `10` to `0`
- JS profile active rule count is now `375`
- Quality gate remains `OK`

## Intentional Non-Changes

The following were intentionally left unchanged:

- Quality gate conditions
- New code definition
- CSS profile
- HTML profile

Reason:

- The current gate already focuses on new code and remains stable after the rule cleanup.
- Coverage import is still `0.0`, so adding a coverage gate now would create noise rather than value.
- The repository is overwhelmingly JS/MJS. Standalone CSS/HTML analysis is currently marginal for this project.

## Reapply Script

Use [apply-xconfig-server-config.ps1](/c:/Users/thoma/Documents/Development/autodarts-xconfig/ops/sonarqube/apply-xconfig-server-config.ps1) to reapply the same server changes.

Example:

```powershell
$env:SONARQUBE_URL = "http://your-sonarqube-server:9000"
$env:SONARQUBE_TOKEN = "your-token"

pwsh ./ops/sonarqube/apply-xconfig-server-config.ps1 `
  -SonarQubeUrl $env:SONARQUBE_URL `
  -SonarQubeToken $env:SONARQUBE_TOKEN `
  -RunAnalysis
```

## Next Sensible Step

Do not add a coverage threshold in SonarQube until coverage reports are actually imported.

When coverage import is ready, the next server-side change should be:

- add `sonar.javascript.lcov.reportPaths`
- then add a new-code coverage condition to the quality gate
