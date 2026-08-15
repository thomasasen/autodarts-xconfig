---
name: package-userscript-release
description: Package or verify an autodarts-xconfig userscript release. Use only for explicit release, finalize, package, ship, publish, version bump, `dist/` refresh, or publication-state verification work. Do not use for ordinary code changes.
---

# Goal

Publish a SemVer userscript release without exposing an update manifest before its payload is available and verified.

# Strict trigger

Use this skill only when the user explicitly asks for release, finalize, package, ship, publish, version bump, `dist/` refresh, or publication-state verification.

# Binding contract

Read and follow [references/release-channel-invariants.md](references/release-channel-invariants.md) completely before release work. Its permanent Raw bridge, skip-version compatibility, immutable tag, remote-main race, and **PAYLOAD FIRST — ADVERTISEMENT SECOND** rules are release gates.

# Core rules

- use SemVer `X.Y.Z` and immutable tag `vX.Y.Z`; tag and package version must be identical
- do not bump versions early and never let `main` advertise an unpublished payload
- do not touch `dist/**` by hand; refresh it only through `npm run build`
- keep package, both package-lock locations, `API_VERSION`, loader, meta, and bundle synchronized
- each stable release has exactly the two fixed assets from the same build as committed `dist`
- use `$maintain-changelog` for curated release notes and compare links
- keep local source, build, commit, tag, draft, published release, assets, Raw bridge, and installed truth separate
- preserve direct skip-version updates for every historical client using the Raw endpoints
- never force-push, rewrite a published tag, or silently replace release assets

# Workflow

1. Confirm publication authorization, clean scope, branch, remote, tags, releases, and exact remote `main` SHA.
2. For the first channel migration, land and push release infrastructure on the old stable version, then run and verify the GitHub `workflow_dispatch` dry run. Record that remote SHA as the migration base.
3. Implement and test source behavior while retaining the old version until final packaging.
4. Curate `CHANGELOG.md`, then synchronize versions and run `npm run build`.
5. Run `npm run check:release` and Tier-3 validation from `$validate-repo-change`, including local SonarQube before tagging. Commit first and rerun Sonar when blame requires it.
6. Review the entire scoped diff and create the final release commit `release: prepare X.Y.Z`.
7. Fetch and require remote `main` to equal the recorded base; also require no conflicting remote tag or GitHub Release.
8. Create tag `vX.Y.Z` on the exact release commit, verify its SHA, and push only the tag.
9. Wait for the tag workflow to create a Draft Release. Verify the unchanged tag, draft/not-prerelease state, exactly two assets, metadata, sizes, and SHA-256 parity with committed `dist`.
10. Publish the verified draft. Verify stable state, tag/commit, both assets, and `releases/latest`.
11. Fetch and repeat the remote-main race gate. Only then fast-forward `main` to the release commit.
12. Verify Raw meta and Raw user, the legacy and new migration paths, skip-version compatibility, and a clean local/remote state.

# Fail closed

Stop before tag, publication, or main update on any dirty/unowned scope, failed check, red Sonar gate, version drift, workflow failure, conflicting tag/release, asset/hash mismatch, wrong `latest`, unexplained build drift, permission failure, or remote-main movement. Do not weaken or skip a gate to finish.

# Output requirements

Report the infrastructure and release commit SHAs, tag and tag SHA, remote-main before/after, workflow run, draft and stable state, asset names/hashes, version parity, Raw bridge state, historical compatibility evidence, update traffic behavior, all validation commands, Sonar result/open findings, browser/Tampermonkey verification boundary, remaining uncertainty, and maintainer asset downloads.
