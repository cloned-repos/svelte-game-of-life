export type Instruction = {
	t: 'l' | 'm' | 'e';
	x: number;
	y: number;
};

export type FontMetrics = {
	errors?: AggregateError[];
	baselines: {
		alphabetic: number;
	};
	ascents: {
		font: { alphabetic: number };
	};
	descents: {
		font: { alphabetic: number };
	};
	aux: {
		cellHeightFont: number;
	};
	glyphs: Record<number, ({} | Instruction)[]>;
	unicode: Record<string, number>;
};

export type CustomTextMetrics = {
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
