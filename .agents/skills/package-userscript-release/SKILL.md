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

1. Confirm publication authorization, clean scope, branch, remote, tags, releases, and exact remote `main` SHA. Record that SHA as the expected remote-main base. STOP if authorization or scope is unclear.
2. For the first channel migration, land and push release infrastructure on the old stable version, then run and verify the GitHub `workflow_dispatch` dry run. STOP if the dry run fails or cannot be verified. Only after success, update the expected remote-main base to the verified infrastructure SHA.
3. Implement and test source behavior while retaining the old version until final packaging.
4. Curate `CHANGELOG.md`, then synchronize versions and run `npm run build`.
5. Run `npm run check:release` and Tier-3 validation from `$validate-repo-change`, including local SonarQube before tagging. Commit first and rerun Sonar when blame requires it. STOP before tagging if a required check fails or is unverified, the Sonar Quality Gate is red or unverified, or versions differ.
6. Review the entire scoped diff. STOP before committing if any unowned or unexplained scope remains. Otherwise create the final release commit `release: prepare X.Y.Z`.
7. Fetch and require remote `main` to equal the expected remote-main base; also require no conflicting remote tag or GitHub Release. On mismatch or conflict, STOP before tagging and report expected/actual SHAs or conflicting tag/release details.
8. Create tag `vX.Y.Z` on the exact release commit, verify its SHA, and push only the tag.
9. Wait for the tag workflow to create a Draft Release. Verify the unchanged tag, draft/not-prerelease state, exactly two assets, metadata, sizes, and SHA-256 parity with committed `dist`. STOP before publication on workflow failure or any missing or mismatched evidence.
10. Publish the verified draft. Verify stable state, tag/commit, both assets, and `releases/latest`. STOP before updating `main` if any published state or endpoint is wrong or unverified.
11. Fetch and repeat the remote-main race gate against the expected remote-main base. On mismatch or missing evidence, STOP and report expected/actual SHAs; leave `main` unchanged. Only after published release verification and a matching remote SHA, fast-forward `main` to the release commit.
12. Verify Raw meta and Raw user, the legacy and new migration paths, skip-version compatibility, and a clean local/remote state.

# Fail closed

Stop before tag, publication, or main update on any dirty/unowned scope, failed check, red Sonar gate, version drift, workflow failure, conflicting tag/release, asset/hash mismatch, wrong `latest`, unexplained build drift, permission failure, or remote-main movement. Do not weaken or skip a gate to finish.

Missing evidence is not a passing check. Report the failed gate and last verified
state; do not automatically roll back published states.

# Output requirements

Report the infrastructure and release commit SHAs, tag and tag SHA, remote-main before/after, workflow run, draft and stable state, asset names/hashes, version parity, Raw bridge state, historical compatibility evidence, update traffic behavior, all validation commands, Sonar result/open findings, browser/Tampermonkey verification boundary, remaining uncertainty, and maintainer asset downloads.
