import type Canvas from '../leaf/canvas.svelte';

const { min, max, trunc, random } = Math;

const INSTRUCTION_QUEUE_SIZE = 50;

export enum DrawInstruction {
    NOOP = 0,
    DRAW = 1,
    DELETE = 2,
}

function instr16Bit(inst: string): number {
    const val = inst[0].charCodeAt(0) * 256 +
        inst[1] ? inst[1].charCodeAt(0) : 0;
    return val;
}

const Instructions = {
    cmdSeed(pct: number, arr: Uint16Array, offset: number): number {
        arr[offset] = instr16Bit('SE');
        arr[offset + 1] = pct;
        return offset + 2;
    },
    sizeSeedCMD() {
        return 3;
    },
    cmdClear(arr: Uint16Array, offset: number): number {
        arr[offset] = instr16Bit('CL');
        return offset + 1;
    },
    sizeClearCMD() {
        return 2;
    },
    cmdPlotTheUpdates(arr: Uint16Array, offset: number): number {
        arr[offset] = instr16Bit('PU');
        return offset + 1;
    },
    sizePlotTheUpdatesCMD() {
        return 2;
    },
    cmdResizeGridSize(w: number, h: number, arr: Uint16Array, offset: number): number {
        arr[offset] = instr16Bit('GS');
        arr[offset + 1] = w;
        arr[offset + 2] = h;
        return offset + 3;
    },
    sizeResizeGridSizeCMD() {
        return 4;
    }
}

const seedHistogram = [
    [1, 0.645],
    [0.95, 0.6124],
    [0.9, 0.58297],
    [0.8, 0.550],
    [0.7, 0.50],
    [0.6, 0.45],
    [0.5, 0.393],
    [0.4, 0.32],
    [0.3, 0.259],
    [0.2, 0.180],
    [0.1, 0.095],
    [0.05, 0.0488],
    [0.02, 0.0198],
].reverse();

const emptyUint16Array = new Uint16Array(0);
const emptyUint8ClampedArray = new Uint8ClampedArray(0);

export type GridData = {
    // the (n x m) grid
    grid: Uint8ClampedArray
    // index to the above "grid" property, field of non empty cells
    index: Uint16Array
    // (visual) updates to the grid (deletes and creations) to bring "grid" and "index"
    //      ,to a next state
    updates: Uint16Array
    // dimensions
    width: number
    height: number
    // color palette
    colors: string[]
};

export default class GOLEngine {
    private width = 0;
    private height = 0;
    private playField: Uint8ClampedArray;
    private colors: string[];
    private updateIndex: Uint16Array;
    private playFieldIndex: Uint16Array;
    private instructionQueue: Uint16Array;
    private latestInstruction: number;
    private canvas: Canvas;

    constructor(
        colors: string[] = ['rgb(245, 247, 249)', 'rgb(0, 166, 133)', 'rgb(0, 204, 187)', 'rgb(210, 224, 49)']

    ) {
        this.colors = colors;
        this.playField = emptyUint8ClampedArray;
        this.playFieldIndex = emptyUint16Array;
        this.updateIndex = emptyUint16Array;
        // 50 should be more then enough
        //  , if more then 50 instructions in the queue
        //  , drop more instructions
        //
        this.instructionQueue = new Uint16Array(INSTRUCTION_QUEUE_SIZE);
        this.latestInstruction = 0;
    }

    register(canvas: Canvas) {
        this.canvas = canvas;
    }

    unregister() {
        this.canvas = null;
    }

    public gridData(): GridData {
        return {
            grid: this.playField, // return copy
            index: this.playFieldIndex,
            updates: this.updateIndex,
            width: this.width,
            height: this.height,
            colors: this.colors
        };
    }

    public updateGridSize(width: number, height: number) {
        if (this.canGrowInstr(Instructions.sizeResizeGridSizeCMD())) {
            this.latestInstruction = Instructions.cmdResizeGridSize(width, height, this.instructionQueue, this.latestInstruction);
        }
    }

    public seedGrid(pct: number) {
        if (this.canGrowInstr(Instructions.sizeSeedCMD())) {
            this.latestInstruction = Instructions.cmdSeed(pct, this.instructionQueue, this.latestInstruction);
        }
    }

    // TODO finish placing commands on the command queue



    /*
        nr of draws * total number of blocks;     fraction of the blocks occupied
        1	                                        0.645
        0.95                                        0.6124
        0.9                                         0.58297
        0.8                                         0.550
        0.7                                         0.50
        0.6                                         0.45
        0.5                                         0.393
        0.4                                         0.32
        0.3                                         0.259
        0.2                                         0.180
        0.1	                                        0.095
        0.05                                        0.0488
        0.02                                        0.0198
    */

    private createEmptyUpdateIndexArray(pct: number) {
        pct = min(max(pct, 0), 1);
        let sizeFraction = seedHistogram.find(([percent,], i) => {
            return (pct < percent);
        });

        sizeFraction = sizeFraction || seedHistogram[seedHistogram.length - 1];
        let absoluutSize = trunc(sizeFraction[1] * this.playField.length * 3);
        absoluutSize = absoluutSize - (absoluutSize % 3);

        const updateIndex = new Uint16Array(absoluutSize);
        return updateIndex;
    }


    private colorPicker(): number {
        const c = trunc(random() * 8) + 1;
        // c=[1,8]
        //
        // pixel color probability distribution
        //1 2 3 4 5 6 7 8
        //1 1 2 2 2 2 3 3
        //
        // color 0 = no pixel
        if (c < 3) {
            return 1;
        }
        if (c > 6) {
            return 3;
        }
        return 2;
    }

    private resizePlayField(npf: Uint8ClampedArray, newWidth: number, newHeight: number) {
        if (!newWidth || !newHeight) {
            return 0;
        }

        const xMax = min(newWidth, this.width);
        const yMax = Math.min(newHeight, this.height);

        // never created before so we need to create everything initially
        if (!this.playFieldIndex.length) {
            // 1st pass
            // copy matrix and count the cells that are not zero
            let indexCounter = 0
            for (let y = 0; y < yMax; y++) {
                for (let x = 0; x < xMax; x++) {
                    const isrc = y * this.width + x;
                    const itrg = y * newWidth + x;
                    const color = this.playField[isrc];
                    if (color) {
                        npf[itrg] = color;
                        indexCounter++;
                    }
                }
            }
            // 2nd pass
            // create Index, and fill in data
            this.playFieldIndex = new Uint16Array(indexCounter * 3);
            indexCounter = 0
            for (let y = 0; y < yMax; y++) {
                for (let x = 0; x < xMax; x++) {
                    const itrg = y * newWidth + x;
                    const color = npf[itrg];
                    if (color) {
                        this.playFieldIndex[indexCounter] = color;
                        this.playFieldIndex[indexCounter + 1] = x;
                        this.playFieldIndex[indexCounter + 2] = y;
                        indexCounter += 3;
                    }
                }
            }
        }
        else {
            // use existing indexCounter to your advantage to calculate new Index
            // 1st pass more efficient setting of cells in the new playField (npf)
            let indexCounter = 0;
            for (let j = 0; j < this.playFieldIndex.length; j += 3) {
                const color = this.playFieldIndex[j];
                const x = this.playFieldIndex[j + 1];
                const y = this.playFieldIndex[j + 2];
                if (x >= xMax || y >= yMax) {
                    continue;
                }
                const itrg = y * newWidth + x;
                npf[itrg] = color;
                indexCounter++;
            }
            // 2nd pass, create new Index and fill it
            const npfi = new Uint16Array(indexCounter * 3);
            indexCounter = 0;
            for (let j = 0; j < this.playFieldIndex.length; j += 3) {
                const color = this.playFieldIndex[j];
                const x = this.playFieldIndex[j + 1];
                const y = this.playFieldIndex[j + 2];
                if (x >= xMax || y >= yMax) {
                    continue;
                }
                if (color) {
                    npfi[indexCounter] = color;
                    npfi[indexCounter + 1] = x;
                    npfi[indexCounter + 2] = y;
                    indexCounter += 3;
                }
            }
            this.playFieldIndex = npfi;
        }

        // parse it twice one to count one to set
        let newUpdateLength = 0;
        for (let i = 0; i < this.updateIndex.length; i += 3) {
            const x = this.updateIndex[i + 1];
            const y = this.updateIndex[i + 2];
            if (x >= newWidth || y >= newHeight) {
                continue;
            }
            newUpdateLength += 3;
        }

        // new updateIndex
        const newUpdateIndex = new Uint16Array(newUpdateLength);

        // now really copy
        newUpdateLength = 0;
        for (let i = 0; i < this.updateIndex.length; i += 3) {
            const c = this.updateIndex[i];
            const x = this.updateIndex[i + 1];
            const y = this.updateIndex[i + 2];
            if (x >= newWidth || y >= newHeight) {
                continue;
            }
            newUpdateIndex[newUpdateLength] = c;
            newUpdateIndex[newUpdateLength + 1] = x;
            newUpdateIndex[newUpdateLength + 2] = y;
            newUpdateLength += 3;
        }

        this.width = newWidth;
        this.height = newHeight;
        const prevSize = this.playField.length;
        this.playField = npf;
        this.updateIndex = newUpdateIndex;
        return prevSize;
    } // resizePlayField

    private canGrowInstr(needed: number): boolean {
        return this.latestInstruction + needed > this.instructionQueue.length;
    }

    private _updateGridSize(width: number, height: number) {
        const newPlayField = new Uint8ClampedArray(width * height);
        return this.resizePlayField(newPlayField, width, height);
    }

    // this should ne its own pluggable class
    private _seedGrid(pct: number = 0.2) {
        if (this.width === 0 || this.height === 0) {
            return emptyUint16Array;
        }

        // estimate size
        const updateIndex = this.createEmptyUpdateIndexArray(pct);

        this.playField.fill(0);

        const count = pct * this.playField.length;
        let numSeeds = 0;
        for (let i = 0; i < count; i++) {
            const xcor = Math.trunc(Math.random() * this.width);
            const ycor = Math.trunc(Math.random() * this.height);
            const idx = xcor + ycor * this.width;

            if (this.playField[idx] !== 0) {
                continue;
            }

            this.playField[idx] = this.colorPicker();
            updateIndex[numSeeds] = this.colorPicker();
            updateIndex[numSeeds + 1] = xcor;
            updateIndex[numSeeds + 2] = ycor;
            numSeeds += 3;
            if (numSeeds >= updateIndex.length) {
                break;
            }
        }
        // compact it
        // initial positioning of the cells, the updateIndex is the same as the playFieldIndex (it is all initial creation of cells)
        this.updateIndex = updateIndex.slice(0, numSeeds);
        this.playFieldIndex = this.updateIndex.slice(0, numSeeds);
        return updateIndex;
    }


}