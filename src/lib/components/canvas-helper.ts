export type GridSize = {
    blk_w: number;
    blk_h: number;
    w: number;
    h: number;
};

const { min, max, trunc } = Math;

export function calcGridSize(
    event: MouseEvent & Event,
    paddingX: number,
    paddingY: number,
    cellWidth: number,
    cellHeight: number,
    gridWidth: number,
    gridHeight: number
): { x: number; y: number } {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const diffx = event.clientX - rect.left - paddingX;
    const diffy = event.clientY - rect.top - paddingY;
    const x = min(max(trunc(diffx / cellWidth), 0), gridWidth - 1);
    const y = min(max(trunc(diffy / cellHeight), 0), gridHeight - 1);
    return { x, y };
}

/**
 * draw cells of the grid
 * @param sx {number} - starting point (in logical units, zero based index) x-axis of the grid you want to draw
 * @param sy {number} - starting point (in logical units, zero based index) y-axis of the grid you want to draw
 * @param w {number} - width of the block area
 * @param h {number} - height of the block area
 * draws from left to right, top to bottom
 */
export function drawBlocks(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    paddingY: number,
    cellHeight: number,
    paddingX: number,
    cellWidth: number,
    cellContentWidth: number,
    cellContentHeight: number
) {
    if (
        (w <= 0 || h <= 0)
        ||
        (sy < 0 || sx < 0)
    ) {
        //console.error(`weird, sy=${sy}, sx=${sx}, w=${w}, h=${h}`);
        return;
    }
    let cursorY = paddingY + sy * cellHeight;
    let iy = 0;
    do {
        let ix = 0;
        // reset X
        let cursorX = paddingX + sx * cellWidth;
        do {
            ctx.fillRect(cursorX, cursorY, cellContentWidth, cellContentHeight);
            cursorX += cellWidth;
            ix++;
        } while (ix < w);
        cursorY += cellHeight;
        iy++;
    } while (iy < h);
}

/**
     *
     * @param o {GridSize} - old box before resize in logical units
     * @param n {GridSize} - current new size of the canvas in logical units
     */
export function resize(
    ctx: CanvasRenderingContext2D,
    o: GridSize,
    n: GridSize,
    paddingY: number,
    cellHeight: number,
    paddingX: number,
    cellWidth: number,
    cellContentWidth: number,
    cellContentHeight: number,
    gridColor: string
): boolean {
    // there was no change, nothing to do
    if (n.blk_w === o.blk_w && n.blk_h === o.blk_h) {
        return false;
    }

    ctx.fillStyle = gridColor;
    // always clear out the edges (to the right and below the grid) that will never have grid cells drawn on them

    // 1. clear out blocks beyond the right of th new grid
    const paddingRightStart = paddingX + n.blk_w * cellWidth;
    if (n.w !== o.w) {
        const w = n.w - paddingRightStart;
        ctx.clearRect(paddingRightStart, 0, w, n.h);
    }

    // 2. clear out block below the bottom edge of the new grid
    const paddingBottomStart = paddingY + n.blk_h * cellHeight;
    if (n.h !== o.h) {
        const h = n.h - paddingBottomStart;
        ctx.clearRect(0, paddingBottomStart, n.w, h);
    }

    /*
scenario: ↓ ↘ →

old            new
+-----------+--|
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+  |
|     B     |  |
+--------------+

n.w >= o.w
n.h > o.h
A = box(o.w, 0, (n.w-o.w), (n.h-0))
B = box(0, o.h, (o.w-0), (n.h-o.h))

{o: {…}, n: {…}}
n: {w: 918, h: 686, blk_w: 151, blk_h: 113}
o: {w: 918, h: 687, blk_w: 151, blk_h: 113}



*/

    if (n.blk_w >= o.blk_w && n.blk_h >= o.blk_h) {
        console.log('scenario: ↓ ↘ →');
        // area A
        drawBlocks(
            ctx,
            o.blk_w,
            0,
            n.blk_w - o.blk_w,
            n.blk_h,
            paddingY,
            cellHeight,
            paddingX,
            cellWidth,
            cellContentWidth,
            cellContentHeight
        );

        // area B
        drawBlocks(
            ctx,
            0,
            o.blk_h,
            o.blk_w - 0,
            n.blk_h - o.blk_h,
            paddingY,
            cellHeight,
            paddingX,
            cellWidth,
            cellContentWidth,
            cellContentHeight
        );
        return true;
    }

    /*
scenario:↑ ↗ →
       old new
+-----------+--+
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+--+
|     B     |  
+-----------+

n.w >= o.w
n.h <= o.h

A = box(O.w, 0, (n.w-o.w), (n.h-0))
B = NA
*/

    if (n.blk_w >= o.blk_w && n.blk_h < o.blk_h) {
        console.log('scenario: ↑ ↗ →');
        // area A
        drawBlocks(
            ctx,
            o.blk_w,
            0,
            n.blk_w - o.blk_w,
            n.blk_h,
            paddingY,
            cellHeight,
            paddingX,
            cellWidth,
            cellContentWidth,
            cellContentHeight
        );
        return true;
    }
    /*
scenario:← ↖ ↑
       new old
+-----------+--+
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+--+
|     B     |  |  
+-----------+--+

n.w <= o.w
n.h <= o.h

A = NA
B = NA
*/
    if (n.blk_w <= o.blk_w && n.blk_h <= o.blk_h) {
        console.log('scenario: ← ↖ ↑');
        // no extra blocks to draw
        return true;
    }
    /*
scenario:← ↙ ↓
       new old
+-----------+--+
|           |  |
|           |  |
|           |  |
|           | A|
|           |  |
+-----------+--+ old
|     B     |  |  
+-----------+--+ new

n.w <= o.w
n.h >= o.h

A = NA
B = Box(0, o.h, n.w, (n.h-o.h))
*/

    if (n.blk_w <= o.blk_w && n.blk_h >= o.blk_h) {
        console.log('scenario: ← ↙ ↓');
        drawBlocks(
            ctx,
            0,
            o.blk_h,
            n.blk_w,
            n.blk_h - o.blk_h,
            paddingY,
            cellHeight,
            paddingX,
            cellWidth,
            cellContentWidth,
            cellContentHeight
        );
        return true;
    }
}