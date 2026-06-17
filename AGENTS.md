Repo-wide constitution only. Use the matching skill for task-specific workflow.

## Priorities

Priority: truthfulness, correctness, minimal diffs, and proportional validation.

- prefer minimal diffs and existing conventions
- preserve architecture boundaries unless the task explicitly requires changing them
- keep Codex context small and open the smallest relevant file set
- work in source, not `dist/`
- never hand-edit generated files

## Scope restrictions

- do not inspect, quote, or diff `dist/**` unless release, package, or
  shipped-output verification is explicitly requested
- do not inspect, quote, or diff `docs/**` by default unless documentation,
  wording synchronization, feature audit, or a specifically cited documentation
  file is in scope
- do not run `git commit`, push, create pull requests, or create releases
  without an explicit user request

## Validation policy

Validation must be proportional to the actual risk and scope of the change.

Do not run `npm test`, the full test suite, SonarQube, a full build, browser
validation, packaging, or release validation by default.

Choose exactly one validation tier unless a failure requires escalation.

### Tier 0: No automated validation

Skip all tests, builds, linting, type checking, SonarQube, and packaging for:

- comments or wording changes
- Markdown or documentation-only changes
- formatting-only changes
- renaming without behavioral impact
- changing constants, defaults, labels, selectors, URLs, timings, thresholds,
  metadata, or configuration values without changing control flow
- changes to test data or examples that do not affect runtime behavior
- changes where the user explicitly requested no validation

Review the diff for correctness and report that automated validation was skipped.

### Tier 1: Targeted validation

Use the smallest directly relevant check for:

- localized logic changes
- fixes within one function, module, component, or userscript feature
- changes with an existing focused test file
- changes limited to one package or subsystem

Preferred order:

1. run the directly affected test file or test case
2. run a file-specific or package-specific lint/type check if available
3. run a focused build only when compilation or bundling is directly affected

Do not run the full test suite after targeted validation passes.

If no targeted test exists, do not automatically fall back to `npm test`.
Use the next smallest relevant check or report that automated validation was
not available.

### Tier 2: Broader validation

Run the relevant package or subsystem test suite only for:

- changes spanning several related modules
- shared utilities used by multiple features
- public interfaces or exported APIs
- build configuration affecting one package
- dependency changes limited to one package
- changes where targeted validation cannot reasonably cover the affected scope

Do not validate unrelated packages or subsystems.

### Tier 3: Full repository validation

Run `npm test` and other repository-wide checks only when at least one of these
conditions applies:

- the user explicitly requests full validation
- a new version, release, package, publication, or shipped artifact is being
  prepared
- `package.json`, lockfiles, repository-wide build configuration, or shared
  infrastructure changes affect the whole repository
- architecture-wide or cross-package behavior changes
- generated release output such as `dist/**` is being refreshed
- the change is intended for a new production build and repository-wide
  validation is required
- a targeted or subsystem check fails in a way that indicates wider impact

Do not run full validation merely because source code changed.

After the smallest sufficient validation passes, stop. Do not add broader
validation solely for additional confidence.

## Workflow skills

- use `$validate-repo-change` after meaningful source changes to select and
  report the smallest validation tier allowed by this file
- `$validate-repo-change` must not override the validation tiers defined here
- do not invoke `$validate-repo-change` for Tier 0 changes unless it is needed
  only to document that validation was skipped
- use `$package-userscript-release` only when the user explicitly asks for
  release, finalize, package, ship, publish, version bump, `dist/` refresh, or
  publication verification
- use `$maintain-changelog` only when changelog, release-note, or compare-link
  work is explicitly in scope

## SonarQube

SonarQube is part of Tier 3 validation only.

When Tier 3 validation is required for a new build, run `npm test`; it includes
`npm run sonar`, which must use `SONARQUBE_URL` and `SONARQUBE_TOKEN` from the
environment or fall back to `~/.codex/config.toml`
`[mcp_servers.sonarqube].env`.

Never print or commit the SonarQube token.

Do not claim that SonarQube is unavailable before checking `npm run sonar`,
but only perform that check when Tier 3 validation is required.

## Completion and reporting

Done means:

- the change is implemented in the correct layer
- the smallest sufficient validation tier was used
- skipped validation is reported truthfully
- release, changelog, browser, packaging, and SonarQube checks were not run
  unless required by the selected tier or explicitly requested

The final response must state:

- what changed
- which validation tier was selected
- exactly what was validated
- what remains unverified
- why broader validation was not run
- a draft commit message when meaningful files changed