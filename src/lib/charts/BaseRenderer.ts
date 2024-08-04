import type { IHarnas } from "$lib/Harnas";
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

type Save = {
    type: 'sa';
}

type Restore = {
    type: 'res'
}

type AllInstructions = LineDash | LineWidth | Fill | Stroke | LineTo | MoveTo | Restore;


export default class BaseRenderer implements Enqueue<AllInstructions> {

    private readonly queue: AllInstructions[];
    private inProcess: boolean;

    constructor(private readonly crc: CanvasRenderingContext2D, harnas: IHarnas){
        this.queue = [];
        this.inProcess = false;
    }

    processQueue(){
        const tasks = this.queue.splice(0);
        for (const t of tasks){
            if (t.type === 'res'){
                this.crc.restore();
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