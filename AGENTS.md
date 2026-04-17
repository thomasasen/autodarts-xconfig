# AGENTS.md

Repo-wide invariants only. Use the matching skill when the task clearly fits.

Priority: truthfulness, correctness, proportional validation.

- prefer minimal diffs and existing conventions
- preserve existing architecture boundaries unless the task explicitly requires changing them
- work in source, not `dist/`
- keep standard ESLint coverage scoped to actively maintained source; exclude archive, backup, vendor, and generated trees from the default lint surface
- run `npm run lint` before declaring done when changes touch linted JS/MJS source, tests, loader code, scripts, or lint configuration
- never hand-edit generated files; refresh them only through the build flow when release work is explicitly requested
- use `.agents/skills/repo-validation/SKILL.md` after changes to choose the smallest sufficient validation
- when browser access is available, Codex may use the connected Chrome browser for analysis, tests, DOM inspection, console, network checks, and task-focused interactions, but only in the currently active tab; do not use other open tabs, switch tabs automatically, open additional tabs, or navigate outside the active tab unless the task explicitly requires it, keep any browser-side changes minimal and limited to debugging, reproduction, verification, or UI tests, use extra caution before potentially destructive actions, and if browser access is unavailable, continue normally and state what could not be verified
- use `.agents/skills/userscript-release/SKILL.md` only for explicitly requested release, finalize, package, ship, or publish work
- whenever Codex completes a successful repo build, include a proposed commit message in the final output even if no commit is created
- proposed commit messages must stay draft-only, be derived from the actual diff for that run, follow `type(optional-scope): concise summary` with an optional body of 1-5 concrete bullets, and say explicitly when there is no meaningful change instead of inventing details
- when a release, version bump, or build was part of the work, the proposed commit message must still summarize the substantive shipped change; do not use generic subjects like `release: bump version to X.Y.Z` unless the diff truly contains only release metadata with no meaningful product, source, test, or config change
- never run `git commit`, push, or create a release automatically unless the user explicitly asks
- report exactly what changed, what was validated, and what remains unverified
- do not declare completion if `npm run lint` was required and failed or was not run; report the lint result explicitly

Done means the change is in the right source layer, the validation for that scope ran or is clearly blocked, any required `npm run lint` pass completed and was reported, and any explicitly requested release work is either completed or called out as pending.
