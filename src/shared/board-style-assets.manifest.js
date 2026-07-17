export const BOARD_STYLE_DESIGNS = Object.freeze([
  Object.freeze({
    value: "winmau-blade-6-tc",
    label: "Winmau Blade 6 TC",
    fileName: "winmau-blade-6-tc.webp",
  }),
  Object.freeze({
    value: "winmau-blade-x",
    label: "Winmau Blade X",
    fileName: "winmau-blade-x.webp",
  }),
  Object.freeze({
    value: "winmau-blade-360-tc",
    label: "Winmau Blade 360 TC",
    fileName: "winmau-blade-360-tc.webp",
  }),
  Object.freeze({ value: "target-tor", label: "Target Tor", fileName: "target-tor.webp" }),
  Object.freeze({
    value: "target-aspar",
    label: "Target Aspar",
    fileName: "target-aspar.webp",
  }),
  Object.freeze({
    value: "unicorn-eclipse-pro-2",
    label: "Unicorn Eclipse Pro 2",
    fileName: "unicorn-eclipse-pro-2.webp",
  }),
  Object.freeze({
    value: "mission-samurai-4",
    label: "Mission Samurai 4",
    fileName: "mission-samurai-4.webp",
  }),
  Object.freeze({
    value: "bulls-nl-advantage-701",
    label: "Bull’s NL Advantage 701",
    fileName: "bulls-nl-advantage-701.webp",
  }),
  Object.freeze({
    value: "shot-bandit",
    label: "Shot Bandit",
    fileName: "shot-bandit.webp",
  }),
  Object.freeze({
    value: "one80-g4-surge",
    label: "One80 G4 Surge",
    fileName: "one80-g4-surge.webp",
  }),
]);

export const BOARD_STYLE_DESIGN_KEYS = Object.freeze(
  BOARD_STYLE_DESIGNS.map((design) => design.value)
);

export const BOARD_STYLE_DESIGN_FILES = Object.freeze(
  Object.fromEntries(BOARD_STYLE_DESIGNS.map((design) => [design.value, design.fileName]))
);

export const BOARD_STYLE_DESIGN_OPTIONS = Object.freeze(
  BOARD_STYLE_DESIGNS.map((design) =>
    Object.freeze({
      value: design.value,
      label: design.label,
    })
  )
);
