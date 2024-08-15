
import type { FontMetricsV2 } from '../types';
import { regExp4Parsing } from './constants';
import type { Instruction } from './types';

function trimComments(line: string): string {
    const pos = line.indexOf('#');
    if (pos >= 0){
        return line.slice(0, pos);
    }
    return line;
}

function trim(line: string): string {
   return line.trim();
}

function parseInstruction(line: string): {} | Instruction {
    const matched = line.match(regExp4Parsing);
    if (matched === null || !matched.groups) {
        return {};
    }
    const { groups: { instr: t, x, y} } = matched;
    return { t, x: parseFloat(x), y:parseFloat(y) };
}

export function isInstruction(u: any): u is Instruction {
    return typeof u?.t === 'string' && typeof u?.x === 'number' && typeof u?.y === 'number';
}

export default function transform(raw: string): ({} | Instruction)[] {
    const lines = raw.split('\n').map(trimComments).map(trim).filter(Boolean);
    const instructions = lines.map(parseInstruction);
    return instructions;
}

function* toIterator<T>(p: T[]){
	for (const _i of p){
		(yield _i) as never;
	}
	return undefined;
}

function* filterTillNFalse<T>(rejects: number, o: Generator<T, undefined, never>, fn: (o: T, i?: number) => boolean): Generator<T, undefined, never> {
	let i = 0;
	let j = rejects;
	for(;;) {
		const v = o.next();
		if (v.done) {
			o.return(undefined); 
			return;
		}
		try {
			const allowed = fn(v.value, i++);
			if (!allowed) {
				j--;
			}
			else {
				yield v.value;
			}
			if (j === 0) {
				o.return(undefined);
				return;
			}
		} catch (e) {
			o.return(undefined);
			return;
		}
	}
}

function* filterTillNTrue<T>(approved: number, o: Generator<T, undefined, never>, fn: (o: T, i?: number) => boolean): Generator<T, undefined, never> {
	let i = 0;
	let j = approved;
	for(;;) {
		const v = o.next();
		if (v.done) {
			o.return(undefined); 
			return;
		}
		try {
			const allowed = fn(v.value, i++);
			if (allowed) {
				j--;
				yield v.value;
			}
			if (j === 0) {
				o.return(undefined);
				return;
			}
		} catch (e) {
			o.return(undefined);
			return;
		}
	}
}

function* map<T,R>(o: Generator<T, undefined, never>, fn: (o:T, i?: number)=> R): Generator<R, undefined, never> {
	let i = 0;
	for(;;) {
		const v = o.next();
		if (v.done) {
			o.return(undefined); 
			return;
		}
		yield fn(v.value, i++);
	}
}

function reduce<T, R>(init: R, o: Generator<T, undefined, never>, fn: (s: R, v: T, i?: number) => R): R {
	let i = 0;
	let reduced = init;
	for (;;) {
		const v = o.next();
		if (v.done) {
			o.return(undefined); 
			return reduced;
		}
		reduced = fn(reduced, v.value, i++);
	}
}


export function getFontMetricsV2(glyphs: Record<number, ({} |Instruction)[]>): FontMetricsV2 {
    const errors: AggregateError[] = [];
	const measure = { yMin: NaN, yMax: NaN };
	for (const [id, glyph] of Object.entries(glyphs)){
		// find incorrect draw commands
        const localGlyphErrors = filterTillNTrue(3, toIterator(glyph), value => {
			return (!isInstruction(value))
		});

		// if errors collect them
		const errorTexts = Array.from(map(localGlyphErrors, instr => `invalid instruction: ${JSON.stringify(instr)}`));
		if (errorTexts.length) {
		   errors.push(new AggregateError(errorTexts, `glyph: ${id}`));
		   continue; // next glyph
		}

		reduce(measure, toIterator(glyph as Instruction[]), (c, instr) => {
			c.yMax = Math.max(instr.y, c.yMax);
			if (isNaN(c.yMax)) {
				c.yMax = instr.y;
			}
			c.yMin = Math.min(instr.y, c.yMin);
			if (isNaN(c.yMin)) {
				c.yMin = instr.y;
			}
			return c;
		});
	}

	const rc: FontMetricsV2 = {
		...(errors.length && { errors }),
		baselines: {
			alphabetic: 0,
		},
		ascents: {
			font: {
				alphabetic: measure.yMax,
			},
		},
		descents: {
			font: {
				alphabetic: measure.yMin,
			},
		},
		aux: {
			cellHeightFont: measure.yMax - measure.yMin,
		}
	};

	return rc;
}

