export const TURN_DART_ASSET_FILES = Object.freeze({
  "german-giant": "turn-dart-german-giant.png",
  "blue-lightning": "turn-dart-blue-lightning.png",
  "copper-grid": "turn-dart-copper-grid.png",
  "snakebite-purple": "turn-dart-snakebite-purple.png",
  "iceman-blue": "turn-dart-iceman-blue.png",
  "bullet-red": "turn-dart-bullet-red.png",
  "carbon-gold": "turn-dart-carbon-gold.png",
  "vecta-gold": "turn-dart-vecta-gold.png",
  "gvv-blue": "turn-dart-gvv-blue.png",
  "cool-hand-luke": "turn-dart-cool-hand-luke.png",
  "target-neon": "turn-dart-target-neon.png",
});

export const TURN_DART_ASSET_KEYS = Object.freeze(Object.keys(TURN_DART_ASSET_FILES));

export const TURN_DART_ASSET_LABELS = Object.freeze({
  "german-giant": "German Gigant",
  "blue-lightning": "Blue Lightning",
  "copper-grid": "Copper Grid",
  "snakebite-purple": "Snakebite Purple",
  "iceman-blue": "Iceman Blue",
  "bullet-red": "Bullet Red",
  "carbon-gold": "Carbon Gold",
  "vecta-gold": "Vecta Gold",
  "gvv-blue": "GVV Blue",
  "cool-hand-luke": "Cool Hand Luke",
  "target-neon": "Target Neon",
});

export const TURN_DART_ASSET_OPTIONS = Object.freeze(
  TURN_DART_ASSET_KEYS.map((value) => Object.freeze({
    value,
    label: TURN_DART_ASSET_LABELS[value],
  }))
);
