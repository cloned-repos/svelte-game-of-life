export type Instruction = {
	t: 'l' | 'm' | 'e';
	x: number;
	y: number;
};

export type FontValidation = {
	errors?: AggregateError[];
	glyphs: Record<number, undefined | Instruction[]>;
};

export type FontMetrics = FontValidation & {
	baselines: {
		alphabetic: number;
		top: number;
		bottom: number;
		middle: number;
		xHeight: number;
	};
	ascents: {
		font: {
			alphabetic: number;
			top: number;
			bottom: number;
			middle: number;
			xHeight: number;
		};
	};
	descents: {
		font: {
			alphabetic: number;
			top: number;
			bottom: number;
			middle: number;
			xHeight: number;
		};
	};
	unicode: Record<string, number>;
};

export type Text = {
	instructions: Instruction[];
	ascents: {
		actual: { alphabetic: number };
	};
	descents: {
		actual: { alphabetic: number };
	};
	actualLeft: number;
	actualRight: number;
};
