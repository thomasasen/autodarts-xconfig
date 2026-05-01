---
name: dart-asset-normalization
description: Normalize and verify bundled Dart marker PNG assets in autodarts-xconfig. Use when a file under `src/assets/darts/` is added, changed, replaced, visually misaligned, or when Dart marker tips no longer sit exactly on the board marker. Also use when updating Dart image geometry constants or asset tests.
---

# Goal

Keep every bundled Dart marker image aligned to the runtime hotspot used by `dart-marker-darts`.

# Core Rules

- work in `src/assets/darts/`, not `dist/`
- use `npm run check:darts` before and after changes to Dart PNGs
- use `npm run normalize:darts` to repair misaligned Dart PNGs
- do not manually edit PNG bytes or hand-tune per-image offsets unless the script cannot safely normalize an asset
- keep runtime constants in `src/features/dart-marker-darts/logic.js` aligned with the normalizer target canvas
- update `tests/runtime/feature-assets.test.js` hashes when normalized image bytes intentionally change

# Workflow

1. Inspect changed files with `git diff --name-only` and identify any `src/assets/darts/Dart_*.png` changes.
2. Run `npm run check:darts`.
3. If the check fails, run `npm run normalize:darts`.
4. Re-run `npm run check:darts`.
5. If PNG bytes changed intentionally, update the asset hash snapshots in `tests/runtime/feature-assets.test.js`.
6. Run the closest tests:
   - `node --test tests/runtime/feature-assets.test.js`
   - `node --test tests/runtime/dart-marker-darts-runtime.test.js`
7. For final validation, use `$validate-repo-change`.

# Hotspot Contract

The normalizer targets the constants exported by `src/features/dart-marker-darts/logic.js`:

- canvas width: `DART_IMAGE_SOURCE_WIDTH`
- canvas height: `DART_IMAGE_SOURCE_HEIGHT`
- tip y-position: `DART_IMAGE_TIP_Y`
- tip x-position: `0`

The script estimates the tip from the leftmost visible alpha band. This is appropriate for the current Dart assets because every Dart points left and uses transparency around the graphic.

# Failure Handling

If `npm run normalize:darts` reports that normalization would clip visible pixels, do not force it. The image needs manual canvas preparation or a larger shared canvas plus matching runtime constant/test updates.
