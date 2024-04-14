export function startAnimFrameDispatcher(callbacks: ((ts?: number) => void)[] = []) {
	let stop = false;
	let nextAnimationFrame = window.requestAnimationFrame(run);
	function run(ts: number) {
		if (stop) {
			cancelAnimationFrame(nextAnimationFrame);
			return;
		}
		nextAnimationFrame = requestAnimationFrame(run);
		// run all callbacks
		callbacks.forEach((cb) => cb(ts));
	}
	return () => {
		stop = true;
		cancelAnimationFrame(nextAnimationFrame);
	};
}
