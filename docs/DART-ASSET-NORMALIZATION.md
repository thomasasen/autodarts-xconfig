# Dart Asset Normalization

`dart-marker-darts` places each Dart PNG by its internal tip hotspot. All bundled Dart images must therefore share one transparent canvas and one tip position.

## Commands

```bash
npm run check:darts
npm run normalize:darts
```

`npm run check:darts` verifies every `src/assets/darts/Dart_*.png`.

`npm run normalize:darts` rewrites only images that are not already normalized.

## Hotspot Contract

The target geometry lives in `src/features/dart-marker-darts/logic.js`:

- `DART_IMAGE_SOURCE_WIDTH`
- `DART_IMAGE_SOURCE_HEIGHT`
- `DART_IMAGE_TIP_Y`

The tip x-position is always `0`. The current target canvas is `789x331`, with the tip at `x=0`, `y=212`.

## How the Script Works

The normalizer reads each PNG as an 8-bit RGBA image, uses the alpha channel to find visible pixels, and estimates the dart tip from the leftmost visible alpha band.

When an image is misaligned, the script creates a transparent target canvas, moves the visible pixels so the estimated tip lands on the shared hotspot, and writes a deterministic PNG. The script does not scale, rotate, recolor, or redraw the Dart.

If moving the image would clip visible pixels, the script fails instead of producing a damaged asset.

## Adding or Replacing a Dart Image

1. Add or replace the PNG in `src/assets/darts/`.
2. Run `npm run check:darts`.
3. If it fails, run `npm run normalize:darts`.
4. Run `npm run check:darts` again.
5. Update `tests/runtime/feature-assets.test.js` asset hashes when the image bytes changed intentionally.
6. Run:

```bash
node --test tests/runtime/feature-assets.test.js
node --test tests/runtime/dart-marker-darts-runtime.test.js
```

If a new Dart is meant to become selectable, also update `src/shared/feature-assets.manifest.js` and the related UI copy/config surfaces.
