# Live DOM Scenarios

- Baseline DOM: inspect the original Autodarts match page without Tampermonkey when host markup is the question.
- X01 no checkout: verify score, player, and board state when no checkout route should be visible.
- X01 visible checkout: verify route text, target markers, and checkout-specific UI state.
- Virtual board: verify SVG/DOM structure when the board is simulated.
- Live board: verify hardware-backed board state when available.
- Checkout Board Targets: verify target overlay placement and visibility.
- TV Board Zoom: verify zoom target choice separately from route visibility.
- Reload/F5 hydration: verify overlays remount correctly after page reload or host DOM replacement.
