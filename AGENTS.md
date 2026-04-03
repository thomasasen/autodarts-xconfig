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
- use `.agents/skills/userscript-release/SKILL.md` only for explicitly requested release, finalize, package, ship, or publish work
- report exactly what changed, what was validated, and what remains unverified
- do not declare completion if `npm run lint` was required and failed or was not run; report the lint result explicitly

Done means the change is in the right source layer, the validation for that scope ran or is clearly blocked, any required `npm run lint` pass completed and was reported, and any explicitly requested release work is either completed or called out as pending.
