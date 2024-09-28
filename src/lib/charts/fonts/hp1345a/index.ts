// source: https://phk.freebsd.dk/hacks/Wargames/
// all glyphs
import _01 from './glyphs/01';
import _02 from './glyphs/02';

import _04 from './glyphs/04';
import _05 from './glyphs/05';
import _06 from './glyphs/06';
import _07 from './glyphs/07';

import _0e from './glyphs/0e';
import _0f from './glyphs/0f';
import _10 from './glyphs/10';
import _11 from './glyphs/11';
import _12 from './glyphs/12';
import _13 from './glyphs/13';
import _14 from './glyphs/14';
import _15 from './glyphs/15';
import _16 from './glyphs/16';
import _17 from './glyphs/17';
import _18 from './glyphs/18';
import _19 from './glyphs/19';
import _1a from './glyphs/1a';
import _1b from './glyphs/1b';
import _1c from './glyphs/1c';
import _1d from './glyphs/1d';
import _1e from './glyphs/1e';
import _1f from './glyphs/1f';
import _20 from './glyphs/20';
import _21 from './glyphs/21';
import _22 from './glyphs/22';
import _23 from './glyphs/23';
import _24 from './glyphs/24';
import _25 from './glyphs/25';
import _26 from './glyphs/26';
import _27 from './glyphs/27';
import _28 from './glyphs/28';
import _29 from './glyphs/29';
import _2a from './glyphs/2a';
import _2b from './glyphs/2b';
import _2c from './glyphs/2c';
import _2d from './glyphs/2d';
import _2e from './glyphs/2e';
import _2f from './glyphs/2f';
import _30 from './glyphs/30';
import _31 from './glyphs/31';
import _32 from './glyphs/32';
import _33 from './glyphs/33';
import _34 from './glyphs/34';
import _35 from './glyphs/35';
import _36 from './glyphs/36';
import _37 from './glyphs/37';
import _38 from './glyphs/38';
import _39 from './glyphs/39';
import _3a from './glyphs/3a';
import _3b from './glyphs/3b';
import _3c from './glyphs/3c';
import _3d from './glyphs/3d';
import _3e from './glyphs/3e';
import _3f from './glyphs/3f';
import _40 from './glyphs/40';
import _41 from './glyphs/41';
import _42 from './glyphs/42';
import _43 from './glyphs/43';
import _44 from './glyphs/44';
import _45 from './glyphs/45';
import _46 from './glyphs/46';
import _47 from './glyphs/47';
import _48 from './glyphs/48';
import _49 from './glyphs/49';
import _4a from './glyphs/4a';
import _4b from './glyphs/4b';
import _4c from './glyphs/4c';
import _4d from './glyphs/4d';
import _4e from './glyphs/4e';
import _4f from './glyphs/4f';
import _50 from './glyphs/50';
import _51 from './glyphs/51';
import _52 from './glyphs/52';
import _53 from './glyphs/53';
import _54 from './glyphs/54';
import _55 from './glyphs/55';
import _56 from './glyphs/56';
import _57 from './glyphs/57';
import _58 from './glyphs/58';
import _59 from './glyphs/59';
import _5a from './glyphs/5a';
import _5b from './glyphs/5b';
import _5c from './glyphs/5c';
import _5d from './glyphs/5d';
import _5e from './glyphs/5e';
import _5f from './glyphs/5f';
import _60 from './glyphs/60';
import _61 from './glyphs/61';
import _62 from './glyphs/62';
import _63 from './glyphs/63';
import _64 from './glyphs/64';
import _65 from './glyphs/65';
import _66 from './glyphs/66';
import _67 from './glyphs/67';
import _68 from './glyphs/68';
import _69 from './glyphs/69';
import _6a from './glyphs/6a';
import _6b from './glyphs/6b';
import _6c from './glyphs/6c';
import _6d from './glyphs/6d';
import _6e from './glyphs/6e';
import _6f from './glyphs/6f';
import _70 from './glyphs/70';
import _71 from './glyphs/71';
import _72 from './glyphs/72';
import _73 from './glyphs/73';
import _74 from './glyphs/74';
import _75 from './glyphs/75';
import _76 from './glyphs/76';
import _77 from './glyphs/77';
import _78 from './glyphs/78';
import _79 from './glyphs/79';
import _7a from './glyphs/7a';
import _7b from './glyphs/7b';
import _7c from './glyphs/7c';
import _7d from './glyphs/7d';
import _b9 from './glyphs/b9';
import _df from './glyphs/df';

import { uknownCharCode } from './constants';

import { filterTillNTrue, isInstruction, map, reduce, transform as t, toIterator } from './helpers';
import type { Text, FontMetrics, Instruction } from './types';

function getUnicodeMapping(): Record<string, number> {
	// Unicode PUA U+E000–U+F8FF
	const map = {
		'\uE099': 1,
		β: 2,
		'\uE000': 4, // tick up (no advance)
		'\uE001': 5, // tick down (no advance)
		'\uE002': 6, // tick left (no advance)
		'\uE003': 7, // tick right (no advance)
		'\uE004': 14, // tick left and right (no advance)
		'\uE005': 15, // tick up and down (no advance)
		'\uE006': 16, // star in place (no advance)
		'\uE007': 17, // circle in place (no advance)
		'\uE008': 0x5f, // underline but backwards (no advance)
		'\uE009': 0xb9, // unknown character
		'↑': 18,
		'←': 19,
		'↓': 20,
		'→': 21,
		'√': 0x16,
		π: 0x17,
		Δ: 0x18,
		μ: 0x19,
		'°': 0x1a, // degree symbol
		Ω: 0x1b,
		ρ: 0x1c,
		Γ: 0x1d,
		θ: 0x1e,
		λ: 0x1f,
		' ': 0x20,
		'!': 0x21,
		'"': 0x22,
		'#': 0x23,
		$: 0x24,
		'%': 0x25,
		'&': 0x26,
		"'": 0x27,
		'(': 0x28,
		')': 0x29,
		'*': 0x2a,
		'+': 0x2b,
		',': 0x2c,
		'-': 0x2e,
		'/': 0x2f,
		'0': 0x30,
		'1': 0x31,
		'2': 0x32,
		'3': 0x33,
		'4': 0x34,
		'5': 0x35,
		'6': 0x36,
		'7': 0x37,
		'8': 0x38,
		'9': 0x39,
		':': 0x3a,
		';': 0x3b,
		'<': 0x3c,
		'=': 0x3d,
		'>': 0x3e,
		'?': 0x3f,
		'@': 0x40,
		A: 0x41,
		B: 0x42,
		C: 0x43,
		D: 0x44,
		E: 0x45,
		F: 0x46,
		G: 0x47,
		H: 0x48,
		I: 0x49,
		J: 0x4a,
		K: 0x4b,
		L: 0x4c,
		M: 0x4d,
		N: 0x4e,
		O: 0x4f,
		P: 0x50,
		Q: 0x51,
		R: 0x52,
		S: 0x53,
		T: 0x54,
		U: 0x55,
		V: 0x56,
		W: 0x57,
		X: 0x58,
		Y: 0x59,
		Z: 0x5a,
		'[': 0x5b,
		'\\': 0x5c,
		']': 0x5d,
		'^': 0x5e,
		// 0x5f, underline but backwards see private unicode page 0xE000-0xE008
		'`': 0x60,
		a: 0x61,
		b: 0x62,
		c: 0x63,
		d: 0x64,
		e: 0x65,
		f: 0x66,
		g: 0x67,
		h: 0x68,
		i: 0x69,
		j: 0x6a,
		k: 0x6b,
		l: 0x6c,
		m: 0x6d,
		n: 0x6e,
		o: 0x6f,
		p: 0x70,
		q: 0x71,
		r: 0x72,
		s: 0x73,
		t: 0x74,
		u: 0x75,
		v: 0x76,
		w: 0x77,
		x: 0x78,
		y: 0x79,
		z: 0x7a,
		'{': 0x7b,
		'|': 0x7c,
		'}': 0x7d,
		_: 0xdf // underline plus advance
	};
	return map;
}

function getGlyps(): Record<string, ({} | Instruction)[]> {
	const glyps = {
		1: t(_01), // hp glyph
		2: t(_02), // beta symbol
		4: t(_04),
		5: t(_05),
		6: t(_06),
		7: t(_07),
		14: t(_0e),
		15: t(_0f),
		16: t(_10),
		17: t(_11),
		18: t(_12), // arrow up
		19: t(_13), // arrow left
		20: t(_14), // arrow down
		21: t(_15), // arrow right
		22: t(_16), // square root
		23: t(_17), // PI π
		24: t(_18), // Delta Δ
		25: t(_19), // μ
		26: t(_1a), //
		27: t(_1b),
		28: t(_1c),
		29: t(_1d),
		30: t(_1e),
		31: t(_1f),
		32: t(_20),
		33: t(_21),
		34: t(_22),
		35: t(_23),
		36: t(_24),
		37: t(_25),
		38: t(_26),
		39: t(_27),
		40: t(_28),
		41: t(_29),
		42: t(_2a),
		43: t(_2b),
		44: t(_2c),
		45: t(_2d),
		46: t(_2e),
		47: t(_2f),
		48: t(_30),
		49: t(_31),
		50: t(_32),
		51: t(_33),
		52: t(_34),
		53: t(_35),
		54: t(_36),
		55: t(_37),
		56: t(_38),
		57: t(_39),
		58: t(_3a),
		59: t(_3b),
		60: t(_3c),
		61: t(_3d),
		62: t(_3e),
		63: t(_3f),
		64: t(_40),
		65: t(_41),
		66: t(_42),
		67: t(_43),
		68: t(_44),
		69: t(_45),
		70: t(_46),
		71: t(_47),
		72: t(_48),
		73: t(_49),
		74: t(_4a),
		75: t(_4b),
		76: t(_4c),
		77: t(_4d),
		78: t(_4e),
		79: t(_4f),
		80: t(_50),
		81: t(_51),
		82: t(_52),
		83: t(_53),
		84: t(_54),
		85: t(_55),
		86: t(_56),
		87: t(_57),
		88: t(_58),
		89: t(_59),
		90: t(_5a),
		91: t(_5b),
		92: t(_5c),
		93: t(_5d),
		94: t(_5e),
		95: t(_5f),
		96: t(_60),
		97: t(_61),
		98: t(_62),
		99: t(_63),
		100: t(_64),
		101: t(_65),
		102: t(_66),
		103: t(_67),
		104: t(_68),
		105: t(_69),
		106: t(_6a),
		107: t(_6b),
		108: t(_6c),
		109: t(_6d),
		110: t(_6e),
		111: t(_6f),
		112: t(_70),
		113: t(_71),
		114: t(_72),
		115: t(_73),
		116: t(_74),
		117: t(_75),
		118: t(_76),
		119: t(_77),
		120: t(_78),
		121: t(_79),
		185: t(_b9), // use as unknown char symbol
		223: t(_df)
	};
	return glyps;
}

export function text2Instructions(text: string, font: FontMetrics): Text | AggregateError[] {
	if (font.errors) {
		return font.errors;
	}
	const text2Glyphs: Instruction[][] = structuredClone(
		text
			.split('')
			.map((char) => font.unicode[char] ?? font.unicode[uknownCharCode])
			.map((code) => font.glyphs[code] as Instruction[])
	);

	let offsetX = 0;
	const finalGlyphs = text2Glyphs
		.map((glyph) => {
			const gl = glyph.map<Instruction>((inst) => ({
				t: inst.t,
				x: inst.x + offsetX,
				y: inst.y
			}));
			offsetX += gl.find((inst) => inst.t === 'e')!.x;
			return gl;
		})
		.flat(1);

	const measure = { yMin: NaN, yMax: NaN, xMax: NaN, xMin: NaN };
	reduce(measure, toIterator(finalGlyphs), (c, instr) => {
		c.yMax = Math.max(instr.y, isNaN(c.yMax) ? instr.y : c.yMax);
		c.yMin = Math.min(instr.y, isNaN(c.yMin) ? instr.y : c.yMin);
		c.xMax = Math.max(instr.x, isNaN(c.xMax) ? instr.x : c.xMax);
		c.xMin = Math.min(instr.x, isNaN(c.xMin) ? instr.x : c.xMin);
		return c;
	});

	// now we calculate metrics
	const rc: Text = {
		instructions: finalGlyphs.flatMap((i) => i),
		ascents: {
			actual: {
				alphabetic: measure.yMax
			}
		},
		descents: {
			actual: {
				alphabetic: measure.yMin
			}
		},
		actualLeft: measure.yMin,
		actualRight: measure.yMax
	};
	return rc;
}

export function getFontMetrics(
	glyphs: Record<number, ({} | Instruction)[]> = getGlyps()
): FontMetrics {
	// glyph cleaning and validation
	const errors: AggregateError[] = [];
	const measure = { yMin: NaN, yMax: NaN };
	for (const [id, glyph] of Object.entries(glyphs)) {
		// find incorrect draw commands
		const localGlyphErrors = filterTillNTrue(3, toIterator(glyph), (value) => {
			return !isInstruction(value);
		});

		// if errors collect them
		const errorTexts = Array.from(
			map(localGlyphErrors, (instr) => `invalid instruction: ${JSON.stringify(instr)}`)
		);

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

	const unicode = getUnicodeMapping();

	const rc: FontMetrics = {
		...(errors.length && { errors }),
		baselines: {
			alphabetic: 0
		},
		ascents: {
			font: {
				alphabetic: measure.yMax
			}
		},
		descents: {
			font: {
				alphabetic: measure.yMin
			}
		},
		aux: {
			cellHeightFont: measure.yMax - measure.yMin
		},
		glyphs,
		unicode
	};

	return rc;
}
