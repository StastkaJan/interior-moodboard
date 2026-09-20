# Board state and geometry

The version 1 board is 1000 by 700 logical units. Its ordered item array is
the stacking order (last item is on top). Selection and pointer previews live
outside this durable record. The initial title is `My room concept` and the
initial palette reference is `sand`.

The caller supplies a unique instance ID and a bundled `Asset` to `add`.
New instances start centered with a preferred width of 180 units, adjusted
to preserve source proportions and fit the board. Adding the same asset again
creates another independent instance; duplicate instance IDs are rejected.

`resize` accepts width as its controlling dimension. Both dimensions have
a minimum of 40 units; the maximum fits the entire board. Resizing preserves
the existing item's aspect ratio, which originates from the catalogue. The
top-left position stays fixed where possible and shifts inward if growth
would cross a board edge. Movement clamps to the same bounds.

Non-finite action coordinates/sizes are ignored. Finite out-of-range values
are clamped. Asset ratios that cannot fit both minimum dimensions are rejected.
The reducer receives valid board state and bundled catalogue records; runtime
validation of untrusted saved data belongs to storage. IDs are created by the
caller, keeping reducer execution deterministic.
