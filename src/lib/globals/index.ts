export function now() {
	return Date.now();
}

export function random() {
	return parseInt(`${Math.random()}`.replace('.', ''));
}
