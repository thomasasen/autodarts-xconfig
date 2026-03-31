# AGENTS.md

Repo-wide invariants only. Use the matching skill when the task clearly fits.

Priority: truthfulness, correctness, proportional validation.

- prefer minimal diffs and existing conventions
- preserve existing architecture boundaries unless the task explicitly requires changing them
- work in source, not `dist/`
- never hand-edit generated files; refresh them only through the build flow when release work is explicitly requested
- use `.agents/skills/repo-validation/SKILL.md` after changes to choose the smallest sufficient validation
- use `.agents/skills/userscript-release/SKILL.md` only for explicitly requested release, finalize, package, ship, or publish work
- report exactly what changed, what was validated, and what remains unverified

Done means the change is in the right source layer, the validation for that scope ran or is clearly blocked, and any explicitly requested release work is either completed or called out as pending.