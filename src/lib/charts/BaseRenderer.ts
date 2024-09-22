import type Context from "./Context";
import type { Enqueue } from "./Enqueue";

type MoveTo = {
    type: 'mt';
    x: number;
    y: number;
}

type LineTo = {
    type: 'lt';
    x: number;
    y: number;
}

type Stroke = {
    type: 'st';
}

type Fill= {
    type: 'fi';
}

type LineWidth = {
    type: 'lw';
    width: number;
}

type LineDash = {
    type: 'ld';
    dashes: number[];
}

type FillStyle = {
    type: 'fs';
    style: string;
}

type StrokeStyle = {
    type: 'ss';
    style: string;
}

type Save = {
    type: 'sa';
}

type Restore = {
    type: 'res'
}

type AllInstructions = MoveTo | LineTo | Stroke | Fill | LineWidth | LineDash | FillStyle | StrokeStyle | Save | Restore;


export default class BaseRenderer implements Enqueue<AllInstructions> {

    private readonly queue: AllInstructions[];
    private inProcess: boolean;

    constructor(private readonly ctx: Context){
        this.queue = [];
        this.inProcess = false;
    }

    private processQueue(){
        const tasks = this.queue.splice(0);
        for (const t of tasks){
            // long list of instruction handlers
            if (t.type === 'res'){
                this.ctx.restore();
                continue;
            }
        }
    }

    enqueue(msg: AllInstructions){
        this.queue.push(msg);
        if (this.inProcess) {
            return;
        }
        this.inProcess = true;
        queueMicrotask(() => this.processQueue.call(this));
    }

   
}