# Board Selection Invariants

- Board SVG root detection should have one shared source of truth.
- Group and radius semantics are compatibility-sensitive; preserve them unless explicitly changing the model.
- Overlay root detection must not silently diverge from board root detection.
- Surface snapshots should represent the same board the overlay uses.
- Reload/F5 can replace host nodes; hydration checks must account for stale references.
