import type Context from '../Context';
import type { Enqueue } from '../Enqueue';

import type AllIns

export default class BaseRenderer implements Enqueue<AllProcessors> {
	private readonly queue: AllInstructions[];
	private inProcess: boolean;

	constructor(private readonly ctx: Context) {
		this.queue = [];
		this.inProcess = false;
	}

	private processQueue() {
		const tasks = this.queue.splice(0);
		for (const t of tasks) {
			// long list of instruction handlers
			if (t.type === 'res') {
				this.ctx.restore();
				continue;
			}
		}
	}

	enqueue(msg: AllInstructions) {
		this.queue.push(msg);
		if (this.inProcess) {
			return;
		}
		this.inProcess = true;
		queueMicrotask(() => this.processQueue.call(this));
	}
}
