import type Canvas from '../../leaf/canvas/indexo.osvelte';

const { min, max, trunc, random } = Math;

//done
const INSTRUCTION_QUEUE_SIZE = 50;

//done
enum OpCodeSymbols {
	GRID_RESIZE = 'G',
	PLOT_UPDATES = 'P',
	CLEAR_CANVAS = 'C',
	SEED = 'S',
	SKIP = 'N',
	NEXT_TICK = 'T'
}

//done
export const OpCodes = {
	[OpCodeSymbols.GRID_RESIZE]: encode(OpCodeSymbols.GRID_RESIZE, 2),
	[OpCodeSymbols.PLOT_UPDATES]: encode(OpCodeSymbols.PLOT_UPDATES, 0),
	[OpCodeSymbols.CLEAR_CANVAS]: encode(OpCodeSymbols.CLEAR_CANVAS, 0),
	[OpCodeSymbols.SEED]: encode(OpCodeSymbols.SEED, 1),
	[OpCodeSymbols.NEXT_TICK]: encode(OpCodeSymbols.NEXT_TICK, 0)
};

//done
function encode(code: string, argLen: number): number {
	return ((code.charCodeAt(0) & 255) << 8) + (argLen & 255);
}

//done
function decode(data: number): { code: OpCodeSymbols; len: number } {
	return { code: String.fromCharCode((data & 0xff00) >> 8) as OpCodeSymbols, len: data & 0x00ff };
}

//done
function getCommand(data: number): string {
	return OpCodeSymbols[String.fromCharCode((data & 0xff00) >> 8)];
}

//done
function* rangeIter(
	commandsAtIndex: number[][],
	data: Uint16Array,
	onlyIndex = true,
	exemptsLast = true,
	...exempts: OpCodeSymbols[]
) {
	if (commandsAtIndex.length === 0) {
		return;
	}

	const lastIndex = commandsAtIndex.length - (exemptsLast ? 1 : 0);
	const last = onlyIndex ? lastIndex : commandsAtIndex[lastIndex][0];

	for (
		let j = 0;
		(j < last && exemptsLast) || (j <= last && !exemptsLast); // 3rd part is empty

	) {
		if (onlyIndex) {
			const len = commandsAtIndex[j][1];
			const posInDataArray = commandsAtIndex[j][0];
			yield { index: posInDataArray, len };
			j++;
			continue;
		}
		const { code, len } = decode(data[j]);
		if (code === OpCodeSymbols.SKIP || exempts.includes(code)) {
			j += len + 1;
			continue;
		}
		yield { index: j, len };
	}
}

//done
const seedHistogram = [
	[1, 0.645],
	[0.95, 0.6124],
	[0.9, 0.58297],
	[0.8, 0.55],
	[0.7, 0.5],
	[0.6, 0.45],
	[0.5, 0.393],
	[0.4, 0.32],
	[0.3, 0.259],
	[0.2, 0.18],
	[0.1, 0.095],
	[0.05, 0.0488],
	[0.02, 0.0198]
].reverse();

const emptyUint16Array = new Uint16Array(0);
const emptyUint8ClampedArray = new Uint8ClampedArray(0);

export type GridData = {
	// the (n x m) grid
	grid: Uint8ClampedArray;
	// index to the above "grid" property, field of non empty cells
	index: Uint16Array;
	// (visual) updates to the grid (deletes and creations) to bring "grid" and "index"
	//      ,to a next state
	updates: Uint16Array;
	// dimensions
	width: number;
	height: number;
	colors: string[];
	// stats
	survive: number;
	died: number;
	birth: number;
	checked: number;
	debugCommands: string[][];
	nrInstructionsInQueue: number;
};

export default class GOLEngine {
	public width = 0;
	public height = 0;
	public playField: Uint8ClampedArray;
	//private colors: string[];
	//private colorDistribution: number[];
	public updateIndex: Uint16Array;
	public playFieldIndex: Uint16Array; // index update -> playField
	private instructionQueue: Uint16Array;
	public latestInstruction: number;
	private canvas: Canvas;
	private opCodes: Map<number, (...args: number[]) => void>;

	// stats
	private survive: number;
	private died: number;
	private birth: number;
	private checked: number;

	constructor(
		private colors: string[] = [
			'rgb(245, 247, 249)', // empty (dead) cell
			'rgb(0, 166, 133)', // random colors for live cells (see colorDistribution)
			'rgb(0, 204, 187)',
			'rgb(210, 224, 49)'
		],
		// number of elements, is same as number of colors - 1 (because 1st one is dead cell color)
		private colorDistribution: Float32Array = new Float32Array([2 / 8, 4 / 8, 2 / 8])
	) {
		// normalize
		const sum = this.colorDistribution.reduce((s, v) => v + s, 0);
		const normalizedDistribution = this.colorDistribution.slice(0);
		normalizedDistribution.forEach((v, i, arr) => {
			if (i === 0) {
				arr[i] = v / sum;
				return;
			}
			arr[i] = arr[i - 1] + v / sum;
		});

		this.colorDistribution = normalizedDistribution;

		this.playField = emptyUint8ClampedArray;
		this.playFieldIndex = emptyUint16Array;
		this.updateIndex = emptyUint16Array;
		// 50 should be more then enough
		//  , if more then 50 instructions in the queue
		//  , drop more instructions
		//
		this.instructionQueue = new Uint16Array(INSTRUCTION_QUEUE_SIZE);
		this.latestInstruction = 0;
		this.opCodes = new Map([
			// grid resize
			[OpCodes[OpCodeSymbols.GRID_RESIZE], this._updateGridSize.bind(this)],
			// plot updates
			[OpCodes[OpCodeSymbols.PLOT_UPDATES], this._plotUpdates.bind(this)],
			// clear canvas
			[OpCodes[OpCodeSymbols.CLEAR_CANVAS], this._clearCanvas.bind(this)],
			// seeding
			[OpCodes[OpCodeSymbols.SEED], this._seedGrid.bind(this)],
			// next step
			[OpCodes[OpCodeSymbols.NEXT_TICK], this._nextStep.bind(this)]
		]);
	}

	public register(canvas: Canvas): void {
		this.canvas = canvas;
		this.canvas.$on('resized', ({ detail: { gridHeight: gh, gridWidth: gw } }: CustomEvent) => {
			this.updateGridSize(gw, gh);
		});
	}

	public unregister(): void {
		this.canvas = null;
	}

	public gridData(): GridData {
		return {
			grid: this.playField, // return copy
			index: this.playFieldIndex,
			updates: this.updateIndex,
			width: this.width,
			height: this.height,
			colors: this.colors,
			//
			survive: this.survive,
			died: this.died,
			birth: this.birth,
			checked: this.checked,
			nrInstructionsInQueue: this.latestInstruction,
			: this.debugGetCommandsInQueue()
		};
	}

	public nextTick(): boolean {
		return this.encodeCommand(OpCodes[OpCodeSymbols.NEXT_TICK]);
	}

	public updateGridSize(width: number, height: number): boolean {
		return this.encodeCommand(OpCodes[OpCodeSymbols.GRID_RESIZE], width, height);
	}

	public plotUpdates(): boolean {
		return this.encodeCommand(OpCodes[OpCodeSymbols.PLOT_UPDATES]);
	}

	public clear(): boolean {
		return this.encodeCommand(OpCodes[OpCodeSymbols.CLEAR_CANVAS]);
	}

	public seedGrid(pct: number): boolean {
		pct *= pct < 1 ? 100 : 1;
		return this.encodeCommand(OpCodes[OpCodeSymbols.SEED], pct);
	}

	// mandatory to call "condenseInstructionsQueue" first
	public execute(hookBeforePlotUpdates?: () => void, hookAfterPlotUpdates?: () => void): void {
		//
		// execute resize instructions first
		//
		this.executeAllGridResizes();
		let i = 0;
		while (i < this.latestInstruction) {
			const opCode = this.instructionQueue[i];
			const opCodeFn = this.opCodes.get(opCode);
			const { code, len } = decode(opCode);
			if (code !== OpCodeSymbols.SKIP) {
				if (!opCodeFn) {
					throw new Error(`Invalid opcode = { ${code}, ${len} } at position ${i}`);
				}
				if (code === OpCodeSymbols.PLOT_UPDATES && hookBeforePlotUpdates) {
					hookBeforePlotUpdates.call(this);
				}
				if (code === OpCodeSymbols.PLOT_UPDATES && hookAfterPlotUpdates) {
					hookAfterPlotUpdates.call(this);
				}
				opCodeFn.apply(this, this.instructionQueue.slice(i + 1, i + len + 1));
			}
			i += len + 1;
		}
		if (i > 0) {
			this.latestInstruction -= i;
		}
	}

	private executeAllGridResizes() {
		for (let i = 0; i < this.latestInstruction; ) {
			const { code, len } = decode(this.instructionQueue[i]);
			if (code === OpCodeSymbols.GRID_RESIZE) {
				const gw = this.instructionQueue[i + 1];
				const gh = this.instructionQueue[i + 2];
				this._updateGridSize(gw, gh);
				this.instructionQueue[i] = encode(OpCodeSymbols.SKIP, len);
			}
			i += len + 1;
		}
	}

	// done
	public debugGetCommandsInQueue(): string[][] {
		const hrQueue: string[][] = [];
		for (let i = 0; i < this.latestInstruction; ) {
			const { code, len } = decode(this.instructionQueue[i]);
			const args = [];
			for (let j = 0; j < len; j++) {
				args.push(this.instructionQueue[i + j + 1]);
			}
			hrQueue.push([code, args.join(', ')]);
			i += len + 1;
		}
		return hrQueue;
	}

	// done
	public condenseInstructionsQueue(): void {
		// 1st pass
		this.condenseGridResizes();
		this.condenseClearGrids();
		this.condenseSeedings();
		this.condensePlots();
		// 2nd pass
		let cursor = 0;
		let cleanCursor = 0;
		// was there any condensing done?
		while (cursor < this.latestInstruction) {
			const { code, len } = decode(this.instructionQueue[cursor]);
			if (code === OpCodeSymbols.SKIP) {
				cursor += len + 1;
				continue;
			}
			this.instructionQueue[cleanCursor] = this.instructionQueue[cursor];
			for (let i = 1; i <= len; i++) {
				this.instructionQueue[cleanCursor + i] = this.instructionQueue[cursor + i];
			}
			cleanCursor += len + 1;
			cursor += len + 1;
		}
		this.latestInstruction = cleanCursor;
	}

	private _nextStep(): void {
		// next evolution
		// 2 pass solution, (need to provision typed arrays)

		// the result of this function
		// - "this.updateIndex" will contain births and deaths
		// - "this.playFieldIndex" will contain births and survivals

		this.checked = 0;
		this.survive = 0;
		this.birth = 0;
		this.died = 0;
		// first pass
		for (let i = 0; i < this.playFieldIndex.length; i += 3) {
			const colorCheck = this.playFieldIndex[i];
			const x = this.playFieldIndex[i + 1];
			const y = this.playFieldIndex[i + 2];
			if (colorCheck === 0) {
				throw new Error(`Internal Error, color 0 encountered at x=${x}, y=${y}`);
			}
			let sum = 0;
			for (let xd = -1; xd <= 1; xd++) {
				for (let yd = -1; yd <= 1; yd++) {
					// do not count yourself
					if (xd === 0 && yd === 0) {
						continue;
					}
					const coords = this.getCoords(x - xd, y - yd);
					const color = this.playField[coords];

					// consider for dead cell resurrection
					if (color === 0) {
						this.playField[coords] = this.colors.length + 2;
						this.checked++;
						// Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
						if (this.deadCellResurrection(x - xd, y - yd)) {
							this.playField[coords] = this.colors.length + 1;
							this.birth++;
						}
						continue;
					}
					// touched it before
					if (color > this.colors.length) {
						continue;
					}
					sum++;
				}
			}
			// Any live cell with two or three live neighbours lives on to the next generation
			if (sum === 3 || sum === 2) {
				this.survive++;
				continue;
			}
			// - Any live cell with fewer than two live neighbors dies (referred to as under population or exposure[1]).
			// - Any live cell with more than three live neighbors dies (referred to as over population or overcrowding).
			this.playFieldIndex[i] = 0;
			this.died++;
		} // for
		//console.log(`first pass: deaths=${deaths}, stayAlive=${stayAlive}, resurrect=${resurrect} changes=${deaths + resurrect}, aliveNext=${stayAlive + resurrect}, considered=${considered}, wasted=${considered - resurrect}`);

		// second pass
		const changes = new Uint16Array((this.died + this.birth) * 3);
		const playFieldIndex = new Uint16Array((this.survive + this.birth) * 3);
		let cursorChanges = 0;
		let playFieldIndexCursor = 0;
		for (let i = 0; i < this.playFieldIndex.length; i += 3) {
			const colorCheck = this.playFieldIndex[i];
			const x = this.playFieldIndex[i + 1];
			const y = this.playFieldIndex[i + 2];

			// deleted
			if (colorCheck === 0) {
				changes[cursorChanges] = 0;
				changes[cursorChanges + 1] = x;
				changes[cursorChanges + 2] = y;
				cursorChanges += 3;
				const coords = y * this.width + x;
				this.playField[coords] = 0;
			} // stayAlive
			else if (colorCheck < this.colors.length) {
				playFieldIndex[playFieldIndexCursor] = colorCheck;
				playFieldIndex[playFieldIndexCursor + 1] = x;
				playFieldIndex[playFieldIndexCursor + 2] = y;
				playFieldIndexCursor += 3;
			}
			// resurrection
			for (let xd = -1; xd <= 1; xd++) {
				for (let yd = -1; yd <= 1; yd++) {
					// do not count yourself
					if (xd === 0 && yd === 0) {
						continue;
					}
					//
					const coords = this.getCoords(x - xd, y - yd);
					const color = this.playField[coords];
					// failed resurrection
					if (color === this.colors.length + 2) {
						this.playField[coords] = 0;
						continue;
					}
					// resurrection succeeded
					if (color === this.colors.length + 1) {
						const newColor = this.colorPicker();
						const xm = coords % this.width;
						const ym = (coords - xm) / this.width;
						if (newColor === 0) {
							throw new Error(
								`Internal Error; new color picked is ${newColor} ofr (${x - xd}, ${y - yd})`
							);
						}
						this.playField[coords] = newColor;

						changes[cursorChanges] = newColor;
						changes[cursorChanges + 1] = xm;
						changes[cursorChanges + 2] = ym;
						cursorChanges += 3;

						playFieldIndex[playFieldIndexCursor] = newColor;
						playFieldIndex[playFieldIndexCursor + 1] = xm;
						playFieldIndex[playFieldIndexCursor + 2] = ym;
						playFieldIndexCursor += 3;
					}
				}
			}
		}
		this.playFieldIndex = playFieldIndex;
		this.updateIndex = changes;
	}

	private deadCellResurrection(x: number, y: number): boolean {
		const c0 = this.getColor(x + 1, y - 1);
		const c1 = this.getColor(x + 0, y - 1);
		const c2 = this.getColor(x - 1, y - 1);
		//
		const c3 = this.getColor(x - 1, y);
		// c4 self is not considered
		const c5 = this.getColor(x + 1, y);

		const c6 = this.getColor(x - 1, y + 1);
		const c7 = this.getColor(x + 0, y + 1);
		const c8 = this.getColor(x + 1, y + 1);
		const low = this.colors.length;
		const sum =
			((c0 && c0 < low && 1) || 0) +
			((c1 && c1 < low && 1) || 0) +
			((c2 && c2 < low && 1) || 0) +
			((c3 && c3 < low && 1) || 0) +
			((c5 && c5 < low && 1) || 0) +
			((c6 && c6 < low && 1) || 0) +
			((c7 && c7 < low && 1) || 0) +
			((c8 && c8 < low && 1) || 0);

		if (sum === 3) {
			return true;
		}
		return false;
	}

	private getCoords(x: number, y: number): number {
		const xm = (x < 0 ? x + this.width : x) % this.width;
		const ym = (y < 0 ? y + this.height : y) % this.height;
		const coords = ym * this.width + xm;
		return coords;
	}

	private getColor(x: number, y: number): number {
		return this.playField[this.getCoords(x, y)];
	}

	private encodeCommand(...data: number[]): boolean {
		const command = data[0];
		const args = data.slice(1);
		const { code, len } = decode(command);

		if (!OpCodes[code]) {
			throw new Error(`Invalid opcode ${getCommand(command)}`);
		}

		if (len != args.length) {
			throw new Error(
				`Code ${getCommand(command)} has invalid length: ${args.length} should be ${len}`
			);
		}

		const canGrow = this.canGrowInstr(len + 1);
		if (!canGrow) {
			this.condenseInstructionsQueue();
			if (!this.canGrowInstr(len + 1)) {
				return false;
			}
		}
		// store it
		const j = this.latestInstruction;
		this.instructionQueue[j] = command;
		for (let i = 0; i < args.length; i++) {
			this.instructionQueue[j + i + 1] = args[i];
		}
		this.latestInstruction += len + 1;
		return true;
	}

	/**
	 * analyzes and cleans the instruction queue
	 * 1. take the latest window resize , set the first window resize to this, make all other resizes NOOP
	 * 2. if there is a "clear", disregard everything before the clear
	 * 3. if there is an seed, disregard everything before the seed before the last seeding
	 * 4. if there is a "plot"
	 *      - only the last plot should be executed, other plots must be made NOOP
	 *
	 * NORMAL MODE: (conway cells evolve over time, needs work)
	 *
	 *
	 * PAUSE MODE: (needs work)
	 *      - merge all conway rules up to the pause in one update
	 *      - merge all mouse-cursor updates up to the pause
	 *      - remove all conway rules step after the pause (up to a potential continue)
	 *      - if there is a continue after the pause remove (NOOP) the steps up to the continue
	 *      - if there is no continue after the pause , NOOP everything till last command, shrink command queue till this pause
	 */

	// STEP 1. take the latest window resize , set the first window resize to this, make all other resizes NOOP
	private condenseGridResizes(): void {
		this.condenseKeepLast(OpCodeSymbols.GRID_RESIZE);
	}

	// STEP 2:
	//  if there is a "clear",
	//      - disregard everything drawn instruction before the last clear
	//      - clear out the updateIndex
	//  - except
	//      - grid resizes

	private condenseClearGrids() {
		this.condenseKeepLast(OpCodeSymbols.CLEAR_CANVAS, false, true, OpCodeSymbols.GRID_RESIZE);
	}

	// STEP 3:
	//  keep the last seed command, disregard all other seeding commands
	private condenseSeedings() {
		this.condenseKeepLast(OpCodeSymbols.SEED);
	}

	// 4. if there is a "plot"
	//     - only the last plot should be executed, other plots must be made NOOP
	private condensePlots(): void {
		this.condenseKeepLast(OpCodeSymbols.PLOT_UPDATES);
	}

	private condenseKeepLast(
		opCode: OpCodeSymbols,
		onlyIndex = true,
		exemptsLast = true,
		...exemptions: OpCodeSymbols[]
	): void {
		const collector: number[][] = [];
		for (let i = 0; i < this.latestInstruction; ) {
			const { code, len } = decode(this.instructionQueue[i]);
			if (code === opCode) {
				collector.push([i, len]);
			}
			i += len + 1;
		}

		const iter = rangeIter(collector, this.instructionQueue, onlyIndex, exemptsLast, ...exemptions);

		for (const step of iter) {
			this.instructionQueue[step.index] = encode(OpCodeSymbols.SKIP, step.len);
		}
	}

	// TODO finish placing commands on the command queue

	/*
        <nr of draws>/<total number of blocks>;     fraction of the blocks occupied
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

	private provisionIndexArrayForSeeding(pct: number) {
		pct = min(max(pct, 0), 1);
		let sizeFraction = seedHistogram.find(([percent]) => {
			return pct < percent;
		});

		sizeFraction = sizeFraction || seedHistogram[seedHistogram.length - 1];
		let absoluteSize = trunc(sizeFraction[1] * this.playField.length * 3);
		absoluteSize = absoluteSize - (absoluteSize % 3);

		const updateIndex = new Uint16Array(absoluteSize);
		return updateIndex;
	}

	private colorPicker(): number {
		const ran = random();
		const idx = this.colorDistribution.findIndex((c) => ran < c);
		if (idx === -1) {
			throw new Error(`Could not sample distribution: ${this.colorDistribution.join(',')}`);
		}
		return idx + 1;
	}

	private resizePlayField(npf: Uint8ClampedArray, newWidth: number, newHeight: number) {
		if (!newWidth || !newHeight) {
			return 0;
		}

		const xMax = min(newWidth, this.width);
		const yMax = min(newHeight, this.height);

		// never created before so we need to create everything initially
		if (!this.playFieldIndex.length) {
			// 1st pass
			// copy matrix and count the cells that are not zero
			let indexCounter = 0;
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
			indexCounter = 0;
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
		} else {
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

		// parse it twice one to count and one to set
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
		return this.latestInstruction + needed < this.instructionQueue.length;
	}

	private _updateGridSize(width: number, height: number) {
		const newPlayField = new Uint8ClampedArray(width * height);
		return this.resizePlayField(newPlayField, width, height);
	}

	// this should ne its own pluggable class
	private _seedGrid(pct = 0.2) {
		if (pct > 1) pct /= 100;
		if (this.width === 0 || this.height === 0) {
			return emptyUint16Array;
		}

		// estimate size
		const updateIndex = this.provisionIndexArrayForSeeding(pct);

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
	}

	private _plotUpdates() {
		if (this.canvas) {
			this.canvas.plotTheUpdates(this.gridData());
		}
	}

	private _clearCanvas() {
		if (this.canvas) {
			this.canvas.clear();
		}
		this.playFieldIndex = emptyUint16Array;
		this.updateIndex = emptyUint16Array;
	}
}
