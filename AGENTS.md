# AGENTS.md

Repo-wide constitution only. Use the matching skill for task-specific workflow.

Priority: truthfulness, correctness, proportional validation.

- prefer minimal diffs and existing conventions
- preserve architecture boundaries unless the task explicitly requires changing them
- keep Codex context small and open the smallest relevant file set
- work in source, not `dist/`
- never hand-edit generated files
- do not inspect, quote, or diff `dist/**` unless release, package, or shipped-output verification is explicitly requested
- do not inspect, quote, or diff `docs/**` by default unless docs, wording sync, feature audit, or an explicitly cited doc file is in scope
- use `$validate-repo-change` after changes to choose and report validation
- use `$package-userscript-release` only when the user explicitly asks for release, finalize, package, ship, publish, version bump, `dist/` refresh, or publication verification
- use `$maintain-changelog` only when changelog, release-note, or compare-link work is explicitly in scope
- do not run `git commit`, push, create PRs, or create releases without an explicit user request
- final output must state what changed, what was validated, what remains unverified, and include a draft commit message when there are meaningful file changes
- when SonarQube is relevant, run `npm test`; it includes `npm run sonar`, which must use `SONARQUBE_URL`/`SONARQUBE_TOKEN` from the environment or fall back to `~/.codex/config.toml` `[mcp_servers.sonarqube].env`
- never claim SonarQube is unavailable before checking `npm run sonar`; never print or commit the SonarQube token

Done means the change is in the right layer, scoped validation ran or is clearly blocked, and any skipped release, changelog, browser, or SonarQube verification is reported truthfully.
