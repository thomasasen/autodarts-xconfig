export const DART_DESIGN_FILES = Object.freeze({
  aireplicant: "Dart_aIreplicant.png",
  bullet: "Dart_bullet.png",
  germangiant: "Dart_germangiant.png",
  mandalorian: "Dart_mandalorian.png",
  nuke: "Dart_nuke.png",
  philtaylor: "Dart_philtaylor.png",
  snakebite: "Dart_snakebite.png",
  standard: "Dart_standard.png",
  stdyellow: "Dart_stdyellow.png",
  stdyellow2: "Dart_stdyellow2.png",
  ultramarine: "Dart_ultramarine.png",
  autodarts: "Dart_autodarts.png",
  blackblue: "Dart_blackblue.png",
  blackgreen: "Dart_blackgreen.png",
  blackred: "Dart_blackred.png",
  blue: "Dart_blue.png",
  camoflage: "Dart_camoflage.png",
  green: "Dart_green.png",
  pride: "Dart_pride.png",
  red: "Dart_red.png",
  white: "Dart_white.png",
  whitetrible: "Dart_whitetrible.png",
  yellow: "Dart_yellow.png",
  yellowscull: "Dart_yellowscull.png",
});

export const DART_DESIGN_KEYS = Object.freeze(Object.keys(DART_DESIGN_FILES));

export const DART_DESIGN_LABELS = Object.freeze({
  aireplicant: "AI Replicant",
  bullet: "Bullet",
  germangiant: "German Giant",
  mandalorian: "Mandalorian",
  nuke: "Nuke",
  philtaylor: "Phil Taylor",
  snakebite: "Snakebite",
  standard: "Standard",
  stdyellow: "Standard Yellow",
  stdyellow2: "Standard Yellow 2",
  ultramarine: "Ultramarine",
  autodarts: "Autodarts",
  blackblue: "Black Blue",
  blackgreen: "Black Green",
  blackred: "Black Red",
  blue: "Blue",
  camoflage: "Camouflage",
  green: "Green",
  pride: "Pride",
  red: "Red",
  white: "White",
  whitetrible: "White Trible",
  yellow: "Yellow",
  yellowscull: "Yellow Scull",
});

export const DART_DESIGN_OPTIONS = Object.freeze(
  DART_DESIGN_KEYS.map((value) => Object.freeze({
    value,
    label: DART_DESIGN_LABELS[value],
  }))
);
