# Release channel invariants

## Public endpoints

- Update manifest: `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.meta.js`
- Current payload: `https://github.com/thomasasen/autodarts-xconfig/releases/latest/download/autodarts-xconfig.user.js`
- Permanent legacy payload bridge: `https://raw.githubusercontent.com/thomasasen/autodarts-xconfig/main/dist/autodarts-xconfig.user.js`
- Every stable release contains exactly `autodarts-xconfig.user.js` and `autodarts-xconfig.meta.js` from the reproducible build.

The two Raw files on `main` are public compatibility interfaces. Never remove them. A historical client that uses the Raw update and download URLs must be able to skip directly to the current stable version.

## Payload first, advertisement second

For every stable release:

1. Build and validate the candidate without moving public `main`.
2. Commit it and create immutable tag `vX.Y.Z` on that exact commit.
3. Push only the tag; the workflow stages a Draft Release with the two fixed assets.
4. Verify tag SHA, draft state, asset names, versions, URLs, sizes, and SHA-256 parity with committed `dist`.
5. Publish the unchanged draft and verify `releases/latest == vX.Y.Z` plus both asset endpoints.
6. Only then fast-forward `main` to the tagged release commit and verify both Raw bridges.

If the payload, tag, release, assets, hashes, `latest`, required checks, or remote-main race state cannot be verified, stop. Never advertise the new version from `main` first.

## Immutable and distinct states

Track these separately and verify every transition:

- local source
- local generated build
- release commit
- immutable `vX.Y.Z` tag
- GitHub Draft Release
- published stable GitHub Release
- release assets
- permanent Raw bridges on `main`
- actually installed userscript version

Never move a published tag, force-push, silently replace a published asset, or treat a green workflow as proof of installed Tampermonkey behavior. A retry may reuse only an unchanged draft for the same verified tag. A faulty published tag requires a new patch version.

## Race and compatibility gates

- Record remote `main` before candidate work and fetch immediately before tag creation and again before the final fast-forward. Any unexpected movement is a hard stop.
- Tag `vX.Y.Z`, package version, lockfile root and workspace version, `API_VERSION`, loader, Raw meta, and Raw user bundle must agree.
- Release assets and committed `dist` must be byte-identical.
- The Raw user bridge remains a full current userscript, so old clients can jump directly to the latest stable release without installing intermediate versions.
- Update checks may request the Raw meta and, only after primary failure, the release meta. They must never request the release `user.js`.
- SonarQube is a local pre-tag gate. GitHub Actions does not replace it.
