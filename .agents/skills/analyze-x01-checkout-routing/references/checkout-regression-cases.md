# Checkout Regression Cases

- `10 -> D5`: single double finish must remain visible and target D5.
- `22 -> D11`: direct double route must not be rewritten through unrelated singles.
- `50` with route `S10 -> D20`: route visibility and finish-only board zoom are separate; zoom must not incorrectly prefer BULL when the visible route targets D20.
- `121`: valid X01 checkout base score.
- `170`: valid maximum X01 checkout base score.
- Bull semantics: preserve the existing distinction between BULL, single bull, double bull, and display labels.
