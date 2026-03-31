# AGENTS.md

Repo-wide invariants only. Use a matching skill when the task clearly fits.

Priority: truthfulness, correctness, validation.

- prefer minimal diffs and existing conventions
- work in source, not `dist/`
- never hand-edit generated files; refresh them only through the build flow when release work is explicitly requested
- choose validation proportional to scope
- report exactly what changed, what was validated, and what remains unverified
- release, finalize, package, ship, and publish work is required only when explicitly requested

Done means the change is in the right source layer, the validation for that scope ran or is clearly blocked, and any explicitly requested release work is either completed or called out as pending.
