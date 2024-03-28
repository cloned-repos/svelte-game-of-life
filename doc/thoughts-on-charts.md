# Chart Size Algorithm (draft)

Preamble:
Ticks & Tick Labels are the hard issue with charts
What humans find visually appeasing (ticks at nice whole numbers or quater fractions 25, 50, 75, 100, 125, etc), or terse number of ticks ending only at "5" and "0", or ticks and labels at even numbers.

We could look at other code (or the results of other code/software package) and try to infer heuristic rules. I looked at R graphs, D3 (ticks on charts are developer driven in D3).

The way forward is best done by makeing very custom charts and have experience of the creation of custom charts drive the creation of "tick code intelligence"
where explicit dev tick creation is replaced by automation.

## Canvas

Font size in chart is fixed, not flexibable,

-   if not enough space to display text/labels , collapse the labels (if marked collapseable) or if not marked collapsable then notify the chart cannot be drawn because of lack of space.
-   if enough space to display text/labels then, the labels + ticks should be displayed at "max-extent" and "chart-area" should eat all the left overflow space

## Vertical space distribution

Vertical direction (from bottom to top) -->
`| gutter-low | x-labels | x-ticks | chart-area | top-label | gutter-top |`

-   `gutter-low`: padding of the chart at the bottom, between `x-labels` and the bottom-edge of the canvas tag element.
-   `x-labels`: the "line-height" see code `process-commands.ts` it is a function of (the calculation of `_fontAscent`, `_actualAscent`, `_fontDescent`, `_actualDescent`or calculated from `ctx.measureText(text)` )

-   `x-ticks`: the x-axis ticks dropdown length (include big-ticks and small ticks). Ticks are a result of a function something like: `const ticks = create_ticks(<x-range-of-chart>)`. When ticks are created there is a `measure(ticks)` to determine enclosing box and use this value to determine space claim for this `x-ticks`.

    -   For now give it a definite size range (min, max)

-   `chart-area`: should be flex, if the computed are is below a minimum then hide some chart components (if possible) and see if the `chart-area` increases a sufficient size. If the hide-algoritm cannot relieve enough space for the `chart-area` then the chart cannot be drawn and some kind of indicator must be shown (red-cross, text, whatever)

-   `gutter top`: I AM HERE

## I AM HERE

this describes the "worst case situation" where you would need

| space of label-overflow at "chart-x-start" | normal labels+ticks under the axis | overflow of label at "chart-x-end"

unline the vertical direction the horizontal direction is mostly data-driven (at what slice of data is one looking at).

-   first build for time-series (resolution), other non-time values we can consider at some later point

-   how to place labels at ticks, there is a preferred step, but if the labels are to wide (like when going from one hour to the next or from one day to the next or one month to the next of one year to then next) then there needs to be extra text needed to mark the transition, so labels are not fixed like 15(sec) or 5m (miniute) crossing or (3pm hours crossing) or 09-oct (midnight crossing) or jun (month) crossing or 2024 ( new-year crossing)

for high frequence data, you can even go to subsecond, like 1 sec, 42sec 4min

powers of 10 0.1.10² (or negative powers if appicable)

data_range -> x-axis length

-   data-range is "independent"
    ⬇ pretend your whole x-axis-length is available to you
    ⬇ calculate the scale of the data range (i guess take the scale of the maxium value)
    ⬇ is the lowest value also of the same scale? (how much is is close to zero)
    ⬇ (example) like 23 and 1E+5, then yes 23 is close to "zero" = 0.00023E+5 so basically 0.0E+5, hence kissing the origin of the axis
    ⬇ calculate density value (xmax- xmin)/(data_range)
    ⬇ normalize to 1-9 and power of 10

example 3/2345 = 0.00127931769 for pixel per unit data (used in the range)

seek the first 2 non rounded to the ceiling per 0.5 of the third digit

0.00127 -> 0.00130 -- 13.0 E-4 or 1.30 E-3
0.00121 -> 0.00125 -- 12.5 E-4 or 1.25 E-3
0.00199 -> 0.00120 -- 12.0 E-4 or 1.20 E-3

instead of repeating the scale we can put the scale at the END (right side) of the char

--------|---------|------- 10e+5
2.5 5.0

min/max \* (xpixel_range) ->

(min expressed in the scale of max)

-> data range is an independent - scale of max value (x.yz) - express min in the scale of the max value
-> let me think about the date range
-> when something gets drawn in the axis space, need to remember it and see if collisions are happening when more labels(ticks whatever) are drawn.
-> the remmeber is not scoped to axis but to the whole chart so we can globally detect collisions depending on what part is being drawn

done --how to detect collisions?
done --the only shapes are boxes and horizontal and vertical line snippets

space out the data (data range) on the canvase (the graph has no labels, ticks);

descrete data points element should only accupy a max size so this limits the effective canvas area.

the maximum ratio of <nr-pixels>/<data range between descrete points> is known up front and this is your maximum zoom level!

if the data only covers the canvas partially (canvas is bigger) then depending the data should be draw aligned to the right or left (developer should select?);
(one could also decide to fix the)
now add ticks (minimum) horizontal and vertical (this causes the data-draw area to shrink, somewhat),
can the data area still shrink?
provision for space for the vertical axis (further shrinking the chart area).
can the data area still shrink?
provision for space for the horizontal axis (further shrinking the chart area).

draw vertical axis (if allowed to draw), mark used areas for ticks and labels
draw horizontal axis (if allowed to draw, watch collisions), mark used areas for ticks and lables, avoiding collisions

done -- build collision detector (this is a logic space).
-- create data axis (scalar units),
do next create time axis (time units, ms, days, month, year, calculate data ticks)
-- progressive draw axis elements (taking collision into account).
done -- lines (horizontal, vertical) can have margins too, these are actually boxes then need slightly different collision detection
