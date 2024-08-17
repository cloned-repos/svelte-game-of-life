export type Instruction = {
	t: 'l' | 'm' | 'e' | 's';
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
};
