// "distribution" must be the "Probability mass function"
export function sample(...distribution: number[]) {
	const sample = Math.random();
	for (let i = 0, sum = distribution[i]; i < distribution.length; i++, sum += distribution[i]) {
		if (sample <= sum) {
			return i;
		}
	}
	return distribution.length;
}

export function prepareGetCoordsRelative(base: number, width: number, height: number) {
	const area = width * height;
	return function adjusted(xd: number, yd: number) {
		const yrow = base - (base % width);
		const xd2 = (base + xd) % width;
		const xd3 = xd2 < 0 ? width + xd2 : xd2;

		// ok so xd3 = adjusted relative to yrow
		// now we check y
		const yrow2 = yrow + yd * width;
		const yrow3 = yrow2 < 0 ? area + yrow2 : yrow2;
		const yrow4 = yrow3 % area;

		return yrow + xd3;
	};
}
