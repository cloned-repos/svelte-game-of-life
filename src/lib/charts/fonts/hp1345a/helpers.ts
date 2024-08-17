import { regExp4Parsing } from './constants';
import type { Instruction, FontMetrics } from './types';

function trimComments(line: string): string {
	const pos = line.indexOf('#');
	if (pos >= 0) {
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
	const {
		groups: { instr: t, x, y }
	} = matched;
	return { t, x: parseFloat(x), y: parseFloat(y) };
}

export function isInstruction(u: any): u is Instruction {
	return typeof u?.t === 'string' && typeof u?.x === 'number' && typeof u?.y === 'number';
}

export function transform(raw: string): ({} | Instruction)[] {
	const lines = raw.split('\n').map(trimComments).map(trim).filter(Boolean);
	const instructions = lines.map(parseInstruction);
	return instructions;
}

export function* toIterator<T>(p: T[]) {
	for (const _i of p) {
		(yield _i) as never;
	}
	return undefined;
}

export function* filterTillNFalse<T>(
	rejects: number,
	o: Generator<T, undefined, never>,
	fn: (o: T, i?: number) => boolean
): Generator<T, undefined, never> {
	let i = 0;
	let j = rejects;
	for (;;) {
		const v = o.next();
		if (v.done) {
			o.return(undefined);
			return;
		}
		try {
			const allowed = fn(v.value, i++);
			if (!allowed) {
				j--;
			} else {
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

export function* filterTillNTrue<T>(
	approved: number,
	o: Generator<T, undefined, never>,
	fn: (o: T, i?: number) => boolean
): Generator<T, undefined, never> {
	let i = 0;
	let j = approved;
	for (;;) {
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

export function* map<T, R>(
	o: Generator<T, undefined, never>,
	fn: (o: T, i?: number) => R
): Generator<R, undefined, never> {
	let i = 0;
	for (;;) {
		const v = o.next();
		if (v.done) {
			o.return(undefined);
			return;
		}
		yield fn(v.value, i++);
	}
}

export function reduce<T, R>(
	init: R,
	o: Generator<T, undefined, never>,
	fn: (s: R, v: T, i?: number) => R
): R {
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
