/**
 * Created by jacobbogers on 04-JULY-2016.
 */
//import ReactDOM from 'react-dom';
//import React from 'react';

function repeat_anim(queue) {
    'use strict';
    queue = queue || [];
    return {
        delta: 0,
        tick_count: 0,
        time_b: 0,
        time_e: 0,
        queue: queue,
        /*target_delta: 33,*/
        status: {
            state: undefined,
            _promise: undefined,
            generation: 0,
            is_paused: undefined,
            prev_ts_stamp_delta: 0,
            prev_time_st: 0
        },
        signal_performance_stats: function (msg) {
            if (this.call_back instanceof Function) {
                this.call_back(msg);
            }
        },
        start_if_stopped: function () {
            if (this.status.state === "running") {
                if (this.is_paused()) {
                    this.pause_off();
                }
                return;
            }
            this.status.generation = 0;
            this.start();
        },
        reset:function(){
            var s = this.status;
            s.generation = 0;
        },
        start: function () {
            var status = this.status;
            var promise = this.status._promise;
            var start = this.start.bind(this);
            var now;

            status.generation = status.generation || 0;
            this.signal_performance_stats({
                tag: "generations-tick",
                generation: status.generation
            });
            if (this.time_b == 0) {
                this.time_e = 0;
                this.time_b = Date.now();
                this.tick_count = 0;
            }
            if (this.time_e == 0) {
                this.tick_count++;
                now = Date.now();
                if (now - this.time_b > 2000) {
                    this.time_e = now;
                    this.delta = this.time_e - this.time_b;
                    this.time_b = 0;
                    this.signal_performance_stats({
                        tag: "fps",
                        delta: this.delta,
                        num_ticks: this.tick_count
                    });
                    this.tick_count = 0;
                    //console.log(this.delta);
                }
            }
            /*var next_delay = Math.max(1, this.target_delta - status.prev_ts_stamp_delta);
            if (next_delay < 0.2 * this.target_delta) {
                next_delay = this.target_delta;
            } else {
                next_delay = next_delay; //for debugging
            }*/

            //console.log(next_delay);
            /*setTimeout(function () {*/
                requestAnimationFrame(function (time_stamp) {
                    status.prev_ts_stamp_delta = time_stamp - status.prev_time_st;
                    status.prev_time_st = time_stamp;
                    status.state = "running";
                    var work = queue.pop();

                    if (typeof work == "string") {
                        if (work == "stop") {
                            status._promise = null; //clear it
                            status.state = "stop";
                            status.is_paused = false;
                            status.generation = 0;
                            if (promise) {
                                promise.res("stopped");
                            }
                            return;
                        }
                        status.state = "error";
                        promise.rej("error");
                        throw new Error('Illegal command');
                    }
                    //console.log({op_type:work.type});
                    work.op(status.is_paused);
                    if (work.type == "repeat") {
                        queue.unshift(work);
                    }
                    if (work.tag == "next-frame" && !status.is_paused) {
                        status.generation++;
                    }
                    start();
                });
            /*}, next_delay);*/
        },
        pause_on: function () {
            this.status.is_paused = true;
        },
        is_paused: function () {
            return (this.status.is_paused ? true : false);
        },
        pause_off: function () {
            this.status.is_paused = false;
        },
        is_stopped: function () {
            return (this.status.state === "stop" ? true : false);
        },
        stop: function () {
            var status = this.status;
            if (this.status._promise) {
                return new Promise(function (res, rej) {
                    return rej("already a stop action pending");
                });

            }
            if (this.status.state != "running") {
                return Promise.resolve("cannot stop, the state was not \"running\" ");
            }
            var p = new Promise(function (res, rej) {
                status._promise = {
                    res: res,
                    rej: rej
                };
            });
            queue.unshift('stop');
            return p;
        }
    }
}




var life_game = {
    animation: null,
    canvas_elt: null,
    blk_width: 0,
    blk_height: 0,
    grid_color: "rgb(245,247,249)",
    frame_current: null,
    frame_next: null,
    frame_work_todo_index: null,
    snail_trail: null,
    snail_trail_wm: 0,
    snail_trail_cursor: 0,
    color1: "rgb(0,166,133)",
    color2: "rgb(0,204,187)",
    color3: "rgb(210,224,49)",
    selected_seed: null,
    nr_cells_processed: [0, 0, 0],
    register_signal_handler:function(func){
        this.call_back = func;
        //decorate animation object
        this.animation.call_back = func;

    },
    signal_performance_stats: function(msg){
        if (this.call_back instanceof Function){
            this.call_back(msg);
        }
    },
    do_next_generation: function (paused) {
        if (paused) {

            this.mouse_mark();
            return;
        }
        this.next_frame_and_swap();
        this.plot_index_buffer();
        this.mouse_mark();
    },
    get_number_snail_items: function () {
        var nr_itms = 0;
        if (this.snail_trail_wm < this.snail_trail_cursor) {
            nr_itms = this.snail_trail_wm + (this.get_snail_length() - this.snail_trail_cursor);
        } else {
            nr_itms = this.snail_trail_wm - this.snail_trail_cursor;
        }
        return nr_itms / 3;

    },
    get_snail_length: function () {
        return (this.snail_trail.length - this.snail_trail.length % 3);
    },
    snail_cursor_next: function () {
        if (this.get_number_snail_items() === 0) {
            return undefined;
        }
        var sl = this.get_snail_length();
        this.snail_trail_cursor += 3;
        if (this.snail_trail_cursor >= sl) {
            this.snail_trail_cursor = 0;
        }
        return this.snail_trail_cursor;
    },
    draw_magnify: function (x, y) {
        var srcctx, ctx, rc;
        if (!(this.canvas_elt_magnify instanceof HTMLElement)) {
            throw new Error('this.elt.canvas is not an HTMLElement');
        }
        if (Number.isInteger(x) && Number.isInteger(y)) {
            this.canvas_elt_magnify.width = 5 * 6 * 2;
            this.canvas_elt_magnify.height = 5 * 6 * 2;
            srcctx = this.canvas_elt.getContext("2d");
            ctx = this.canvas_elt_magnify.getContext("2d");
          ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
   ctx.msImageSmoothingEnabled = false;
            rc = this.get_color_from_frame(x, y);
            ctx.drawImage(this.canvas_elt, x - 6 * 3, y - 6 * 3, 30, 30, 0, 0, 5 * 12, 5 * 12);
            this.canvas_elt_magnify.style.left = (x - 5 * 6) + "px";
            this.canvas_elt_magnify.style.top = (y - 5 * 6) + "px";
        }
    },
    clear: function () {
        this.clear_screen();
        this.frame_current.fill(0);
        this.frame_next.fill(0);
        this.frame_work_todo_index.fill(0);
        this.snail_trail.fill(0);
        this.snail_trail_wm = 0;
        this.snail_trail_cursor = 0;
    },
    init: function (canvas_elt, canvas_elt_magnify) {
        this.canvas_elt_magnify = canvas_elt_magnify;
        this.canvas_elt = canvas_elt;
        this.clear_screen();
        var grid_size = this.blk_width * this.blk_height;
        this.frame_current = new Uint8ClampedArray(grid_size);
        this.frame_next = new Uint8ClampedArray(grid_size);
        this.frame_work_todo_index = new Int32Array(grid_size);
        this.snail_trail = new Int32Array(grid_size);
        this.snail_trail_wm = 0;
        this.snail_trail_cursor = 0;
        //
    },
    clear_screen: function () {
        var i, j;
        if (!(this.canvas_elt instanceof HTMLElement)) {
            throw new Error('this.elt.canvas is not an HTMLElement');
        }
        var ctx = this.canvas_elt.getContext("2d");
        ctx.clearRect(0, 0, this.canvas_width, this.canvas_height);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
        ctx.lineCap = 'square';
        ctx.fillStyle = this.grid_color;

        for (i = 0; i < this.blk_width; i++) {
            for (j = 0; j < this.blk_height; j++) {
                var offsetx = 1 + 6 * i;
                var offsety = 1 + 6 * j;
                ctx.fillRect(offsetx, offsety, 4, 4);
            }
        }

    },
    color_picker: function () {
        var c = Math.trunc(Math.random() * 8) + 1;
        //
        //1 2 3 4 5 6 7 8
        //1 1 2 2 2 2 3 3
        //
        if (c < 3) {
            return 3;
        }
        if (c > 6) {
            return 1;
        }
        return 2;
    },
    seed_random_20pct:function(){
        this.seed_random_percentage(0.2);
    },
    seed_random_60pct:function(){
        this.seed_random_percentage(0.6);
    },
    seed_random_percentage: function (pct) {

        var max_num = this.blk_width * this.blk_height,
            work_inserted = 0,
            i = 0;
        this.frame_current.fill(0, 0);
        this.frame_next.fill(0, 0);
        this.frame_work_todo_index.fill(0, 0);

        var dont_try = false;
        if (pct >  0.2) {
            dont_try = true;
        }
        if (pct === undefined) {
            pct = 0.2;
        }

        var count = pct*max_num;

        var arr = new Array(max_num);

        for (i = 0; i <= count;) {
            var xcor = Math.trunc(Math.random() * this.blk_width);
            var ycor = Math.trunc(Math.random() * this.blk_height);
            var index = xcor + (ycor * this.blk_width);
            var t = this;
            if (this.frame_current[index] == 0) {
                this.frame_current[index] = this.color_picker();
                this.frame_work_todo_index[work_inserted] = index;
                work_inserted++;
                i++;
                continue;
            }
            if (dont_try) {
                i++;
            }
        }
        this.work_todo = work_inserted;
        return this.work_todo;
    },
    seed_colony: function (count) {

    },
    seed_space_invaders: function () {

    },
    seed_game_of_life: function () {
        var max_num = this.blk_width * this.blk_height;
        this.frame_current.fill(0, 0);
        this.frame_next.fill(0, 0);
        this.frame_work_todo_index.fill(0, 0);

        this.frame_work_todo_index[0] = 10 + this.blk_width - 1;
        this.frame_work_todo_index[1] = 10 + this.blk_width;
        this.frame_work_todo_index[2] = 10 + this.blk_width + 1;
        this.work_todo = 3;
        for (var i = 0; i < 3; i++) {
            this.frame_current[this.frame_work_todo_index[i]] = 2;
        }
    },
    add_cell: function (x, y) {
        var rc = this.get_color_from_frame(x, y);
        if (rc.color == undefined) {
            return; //do nothing, this is a sign the grid has been altered
        }
        if (this.frame_current[rc.coords] == 0) {
            this.frame_work_todo_index[this.work_todo] = rc.coords;
            this.frame_current[rc.coords] = this.color_picker();
            this.work_todo++;
        }
    },
    mouse_mark: function (x, y, btn_press) {

        var ctx = this.canvas_elt.getContext("2d");
        this.cursor = this.cursor || {};

        var new_coords, nr_items;
        var xcor;
        var ycor;
        var color;
        var i;
        var snail_length;
        var nr_itms;
        var x;
        var y;
        var b;

        snail_length = this.snail_trail.length - this.snail_trail.length % 3;
        if (Number.isInteger(x) && Number.isInteger(y)) {
            if (this.snail_trail_wm == snail_length) { //no more space, round robin
                if (this.snail_trail_cursor < 3) {
                    console.log("to much data in the buffer to draw, not accepting mouse input");
                    //oops I have to ignore this mouse move move
                    return;
                }
                this.snail_trail_wm = 3;
                this.snail_trail[0] = x;
                this.snail_trail[1] = y;
                this.snail_trail[2] = btn_press ? 1 : 0;
            } else {
                i = this.snail_trail_wm;
                this.snail_trail[i] = x;
                this.snail_trail[i + 1] = y;
                this.snail_trail[i + 2] = btn_press ? 1 : 0;
                this.snail_trail_wm += 3;
            }
            this.plot_red_marker(x, y);
            this.draw_magnify(x, y);
            return;
        }
        //
        //length=300, 0-299 is index
        //cursor=30, wm=60  on nr-items = 30
        //cursor=30 wm=30 nr-items = 30+  300-30 = 300
        //cursor=30 wm=10 nr-items = 10 + 300-30 = 300-20=280
        nr_items = this.get_number_snail_items();

        if (nr_items == 1) {
            //if (this.status.capture == "entered") {
            i = this.snail_trail_cursor;
            x = this.snail_trail[i];
            y = this.snail_trail[i + 1];
            b = this.snail_trail[i + 2];
            //possibly add it to the frame
            if (b) {
                this.add_cell(x, y);
            }
            this.draw_magnify(x, y);
            this.plot_red_marker(x, y);
            this.snail_trail[i + 2] = 0; //dont add it to the frame next time
            return;
        }
        while (this.get_number_snail_items() > 1) {
            i = this.snail_trail_cursor;
            this.snail_cursor_next();
            if (!Number.isInteger(i)) {
                throw new Error('This should not happen!');
            }
            x = this.snail_trail[i];
            y = this.snail_trail[i + 1];
            b = this.snail_trail[i + 2]; //TODO: make it permanent the frame
            if (b) {
                this.add_cell(x, y);
            }
            this.restore_color(x, y); //TODO: DO NOT restore color if it is permanent to the frame
        }
    },
    color_index_to_color: function (_color) {
        switch (_color) {
        case 0:
            _color = this.grid_color;
            break;
        case 1:
            _color = this.color1;
            break;
        case 2:
            _color = this.color2;
            break;
        case 3:
            _color = this.color3;
            break;
        default:
            throw new Error('illegal color idx');
        }
        return _color;
    },

    get_color_from_frame: function (x, y) {
        var xcor = ((x - 1) - (x - 1) % 6) / 6;
        var ycor = ((y - 1) - (y - 1) % 6) / 6;
        var coords = xcor + ycor * this.blk_width;
        var color = this.frame_current[coords];
        return ({
            color: color,
            xcor: xcor,
            ycor: ycor,
            coords: coords

        });
    },

    restore_color: function (x, y) {
        var ctx = this.canvas_elt.getContext("2d");
        if (Number.isInteger(x) && Number.isInteger(y)) {
            var rc = this.get_color_from_frame(x, y);
            if (rc.color == undefined) {
                return;
            }
            var color = this.color_index_to_color(rc.color);
            ctx.fillStyle = color;
            ctx.fillRect(1 + rc.xcor * 6, 1 + rc.ycor * 6, 4, 4);
        }
    },

    plot_red_marker: function (x, y) {
        var ctx = this.canvas_elt.getContext("2d");
        if (Number.isInteger(x) && Number.isInteger(y)) {
            var rc = this.get_color_from_frame(x, y);
            ctx.fillStyle = "red";
            ctx.fillRect(1 + rc.xcor * 6, 1 + rc.ycor * 6, 4, 4);
        }
    },

    plot_index_buffer: function () {

        var ctx = this.canvas_elt.getContext("2d");
        var coords;
        var color;
        var xcor;
        var ycor
            //ctx.clearRect(0,0,this.canvas_width,this.canvas_height);
        var i;
        this.canvas_elt.style.visibility = 'hidden';
        this.cursor = this.cursor || {};
        for (i = 0; i < this.work_todo; i++) {
            coords = this.frame_work_todo_index[i];
            xcor = coords % this.blk_width;
            ycor = (coords - xcor) / this.blk_width;
            color = this.frame_current[coords];
            color = this.color_index_to_color(color);
            ctx.fillStyle = color;
            ctx.fillRect(1 + xcor * 6, 1 + ycor * 6, 4, 4);

        }
        this.nr_cells_processed[2] = this.work_todo;
        this.canvas_elt.style.visibility = 'visible';

        //console.log({s1:stats[0],s2:stats[1],s3:stats[2],s4:stats[3], total:stats[0]+stats[1]+stats[2]+stats[3]});
    },

    game_of_life_rules: function (cell, coords) {
        var nr = 0;
        var rc = 0;
        var current_state;
        for (var i = 0; i < cell.length; i++) {
            current_state = this.frame_current[cell[i]];
            if (!(current_state == 0 || current_state == 255)) {
                nr++;
            }
        }
        current_state = this.frame_current[coords];
        current_state = (current_state == 255) ? 0 : current_state;
        var is_dead = (current_state == 0);

        // 4.Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
        if (is_dead && nr == 3) {
            rc = this.color_picker();
            if (rc < 1) {
                throw new Error('wrong color picked');
            }

        } else
        // 3.Any live cell with more than three live neighbours dies, as if by over-population.
        if (!is_dead && nr > 3) {
            rc = 0;

        } else
        // 2.Any live cell with two or three live neighbours lives on to the next generation.
        if (!is_dead && (nr == 2 || nr == 3)) {
            rc = current_state; //dont change color

        } else
        // 1.Any live cell with fewer than two live neighbours dies, as if caused by under-population.
        if (!is_dead && nr < 2) {
            rc = 0; //dead

        }
        return rc;
    },
    _get_surrounding_cells: function (cell, coords) {
        var cell_c;
        var nr_cells = this.blk_width * this.blk_height;
        var xcor = coords % this.blk_width;
        var ycor = (coords - xcor) / this.blk_width;
        var xleft;
        var xright;
        var ytop;
        var ybottom;
        //periodic boundery conditions
        xleft = xcor - 1;
        if (xleft < 0) {
            xleft = this.blk_width - 1;
        }
        xright = xcor + 1;
        if (xright >= this.blk_width) {
            xright = 0;
        }
        ytop = ycor - 1;
        if (ytop < 0) {
            ytop = this.blk_height - 1;
        }
        ybottom = ycor + 1;
        if (ybottom >= this.blk_height) {
            ybottom = 0;
        }
        //1st scan line
        cell_c = ytop * this.blk_width;
        cell[0] = cell_c + xleft;
        cell[1] = cell_c + xcor;
        cell[2] = cell_c + xright;
        //2nd scan line
        cell_c = ycor * this.blk_width;
        cell[3] = cell_c + xleft;
        cell[4] = cell_c + xright;
        //3rd scan line
        cell_c = ybottom * this.blk_width;
        cell[5] = cell_c + xleft;
        cell[6] = cell_c + xcor;
        cell[7] = cell_c + xright;

    },

    find_in_idx: function (coord) {
        for (var i = 0; i < this.work_todo; i++) {
            if (this.frame_work_todo_index[i] == coord) {
                return true;
            }
        }
        return false;
    },

    next_frame_and_swap: function () {
        var i, j;
        var coords;
        var cells;
        var color;
        //expand candidates

        var cells = [0, 0, 0, 0, 0, 0, 0, 0];
        var nr_cells = this.blk_width * this.blk_height;
        i = 0;
        j = 0;

        if (this.work_todo == 0) {
            this.nr_cells_processed[0] = 0;
            this.nr_cells_processed[1] = 0;
            this.nr_cells_processed[2] = 0;
            this.signal_performance_stats({tag:"cell-stats",cells_processed:0,cells_drawn:0});
            return;
        }

        do {
            coords = this.frame_work_todo_index[j];
            if (this.frame_current[coords] == 0) {
                j++;
                continue;
            }
            this.frame_work_todo_index[i] = this.frame_work_todo_index[j];
            i++;
            j++;
        } while (j < this.work_todo);
        this.work_todo = i;
        this.nr_cells_processed[0] = j;
        this.signal_performance_stats({tag:"cell-stats",cells_drawn:j,cells_processed:i});

        if (this.work_todo == 0) {
            this.nr_cells_processed[1] = 0;
            this.nr_cells_processed[2] = 0;
            return;
        }
        var old_work_limit = this.work_todo;
        for (i = 0; i < old_work_limit; i++) {
            //expand phase
            coords = this.frame_work_todo_index[i];
            this._get_surrounding_cells(cells, coords);
            for (j = 0; j < 8; j++) {
                if (cells[j] > (nr_cells - 1)) {
                    throw new Error("Index out of bounds");
                }
                color = this.frame_current[cells[j]];
                if (color == 0) {
                    this.frame_current[cells[j]] = 255; /*I NEED A NON ZERO MARKER */
                    this.frame_work_todo_index[this.work_todo] = cells[j];
                    this.work_todo++;
                }
                if (this.work_todo > nr_cells) {
                    throw new Error("index grows larger then buffer");
                }
            }
            color = this.game_of_life_rules(cells, coords);
            this.frame_next[coords] = color;
        }
        for (i = old_work_limit; i < this.work_todo; i++) {
            coords = this.frame_work_todo_index[i];
            if (this.frame_current[coords] != 255) {
                continue;
            }
            this._get_surrounding_cells(cells, coords);
            color = this.game_of_life_rules(cells, coords);
            this.frame_next[coords] = color;
            this.frame_current[coords] = 0; /* REMOVER the value 255 marker */
        }

        if (this.work_todo == 0) {
            this.nr_cells_processed[2] = 0;
            return;
        }

        var vw_view = this.frame_work_todo_index.subarray(0, this.work_todo);
        vw_view.sort(function (a, b) {
            return (a - b);
        });

        i = 0;
        j = 0;
        var prevs_coords = undefined;

        do {
            coords = this.frame_work_todo_index[j];
            if (this.frame_current[coords] == 0 && this.frame_next[coords] == 0) {
                j++;
                continue;
            }
            this.frame_work_todo_index[i] = this.frame_work_todo_index[j];
            if (i == 0) {
                if (coords) { //non null
                    this.frame_next.fill(0, 0, coords);
                }

            } else {
                this.frame_next.fill(0, prevs_coords + 1, coords);
            }
            prevs_coords = coords;
            i++;
            j++;
        } while (j < this.work_todo);
        //lead out
        if (i > 0) {
            this.frame_next.fill(0, coords + 1, this.frame_next.length);
        }
        this.work_todo = i;
        this.nr_cells_processed[1] = j;
        this.nr_cells_processed[2] = i;


        var temp = this.frame_current;
        this.frame_current = this.frame_next;
        this.frame_next = temp;
    }

};

var rep = repeat_anim([{
    type: "repeat",
    op:life_game.do_next_generation.bind(life_game),
    tag: "next-frame"
}]);

life_game.animation = rep;

var util = {
    add_classes(elt, classnames) {
        var i;
        if (typeof elt == "string") {
            elt = document.getElementById(elt);
        }
        if (!(classnames instanceof Array)) {
            classnames = [classnames];
        }
        for (i = 0; i < classnames.length; i++) {
            elt.classList.add(classnames[i]);
        }
        return elt;
    },

    remove_classes(elt, classnames) {
        var i;
        if (typeof elt === "string") {
            elt = document.getElementById(elt);
        }
        if (!(classnames instanceof Array)) {
            classnames = [classnames];
        }
        for (i = 0; i < classnames.length; i++) {
            elt.classList.remove(classnames[i]);
        }
        return elt;
    },

    contains_any_class(elt, classnames) {
        var i;
        if (typeof elt === "string") {
            elt = document.getElementById(elt);
        }
        if (!(classnames instanceof Array)) {
            classnames = [classnames];
        }
        for (i = 0; i < classnames.length; i++) {
            if (elt.classList.contains(classnames[i])) {
                return true;
            }
        }
        return true;
    },

    throttle(type, name, obj) {
        'use strict';
        obj = obj || window;
        var running = false;

        var func = function(original_evt) {
            if (running) {
                return;
            }
            running = true;
            requestAnimationFrame(function() {
                var event = new CustomEvent(name, {'detail': original_evt});
                console.log('event:' + name);
                obj.dispatchEvent(event);
                running = false;
            });
        };
        obj.addEventListener(type, func);
        return func;
    },

    throttle_fun(func) {
        'use strict';
        var critical_section;

        return function() {
            if (critical_section) {
                return undefined;
            }

            critical_section = true;
            var rc;
            requestAnimationFrame(function() {
                rc = func();
                critical_section = false;
            });

            return {rc: rc}; //it can make sense
        }
    },

    ll(str) {
        console.log(str);
    },

    generateUUID() {
        'use strict';
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x'
                ? r
                : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }
};

var FlapoutFooter = React.createClass({
    _ll(str) {
      //  console.log(str + ":[" + this.constructor.displayName + "]");
    },
    _msg_handler(msg) {
        throw new Error('[App] received an unknown message:' + msg);
    },
    _select_radio(evt) {
        var r_value = evt.target.value;
        this.setState({radio_selection: r_value});
        life_game.animation.pause_on();
        life_game.clear();
        switch (r_value) {
            case "seed_60pct":
                life_game.selected_seed = life_game.seed_random_60pct;
                break;
            case "seed_20pct":
                life_game.selected_seed = life_game.seed_random_20pct;
                break;
            default:
                life_game.selected_seed = life_game.seed_random_20pct;
        }
        life_game.selected_seed();
        life_game.plot_index_buffer();
        /*life_game.animation.start_if_stopped();*/
    },
    _clear_selection: function() {
        this.setState({radio_selection: ''});
    },
    getInitialState() {
        this._ll("getInitialState");
        return ({radio_01: util.generateUUID(), radio_02: util.generateUUID()});
    },

    componentWillMount() {
        this._ll("componentWillMount");
    },

    componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },

    componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },

    componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },

    componentWillUnmount() {
        this._ll("componentWillUnmount");
    },

    componentDidMount() {
        this._ll("componentDidMount");
    },

    shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        return true;
    },

    render() {

        var is_seed_20pct = (this.state.radio_selection == "seed_20pct")
            ? true
            : false;
        var is_seed_60pct = (this.state.radio_selection == "seed_60pct")
            ? true
            : false;

        return (
            <div className="footer">
                <p className="section-heading">[select seeding]
                </p>
                <ul className="table select-radio">
                    <li>
                        <span>
                            <input type="radio" id={this.state.radio_01} value="seed_20pct" checked={is_seed_20pct} name="selector" onChange={this._select_radio}/>
                            <label htmlFor={this.state.radio_01}>
                                <span className="radio-text">Random seeding 20%</span>
                              {<div className="check">
                                    <div>
                                        <div></div>
                                    </div>
                                </div>}
                            </label>
                        </span>
                    </li>
                    <li>
                        <span>
                            <input type="radio" id={this.state.radio_02} value="seed_60pct" name="selector" checked={is_seed_60pct} onChange={this._select_radio}/>
                            <label htmlFor={this.state.radio_02}>
                                <span className="radio-text">Random seeding 60%</span>
                                <div className="check">
                                    <div>
                                        <div></div>
                                    </div>
                                </div>
                            </label>
                        </span>
                    </li>
                </ul>
            </div>
        );
    }
});

var FlapoutMain = React.createClass({
    _ll(str) {
        //console.log(str + ":[" + this.constructor.displayName + "]");
    },

    _toggle_play_pause(evt) {
        var rc = (life_game.animation.is_paused() || life_game.animation.is_stopped());
        if (rc) {
            life_game.animation.start_if_stopped();
        } else {
            life_game.animation.pause_on();
        }
        this.setState({
            is_paused: !rc
        });
    },
    _pause_and_clear(evt) {
        life_game.animation.pause_on();
        life_game.animation.reset();
        life_game.clear();
        this.props.signal_parent({tag: "clear_and_pause"});
        /*
        life_game.animation.stop().then(function() {
            life_game.clear();
            life_game.animation.start();
            life_game.animation.pause_on();
            this.props.signal_parent({tag:"clear_and_pause"});
        }).catch(function(reason) {
            console.log("could not stop:" + reason);
        });*/
        return;
    },
    _msg_handler(msg) {
        throw new Error('[App] received an unknown message:' + msg);
    },
    getInitialState() {
        this._ll("getInitialState");
        return ({input_id: util.generateUUID(), is_paused: false});
    },
    componentWillMount() {
        this._ll("componentWillMount");
    },
    componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },
    componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },
    componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },
    componentWillUnmount() {
        this._ll("componentWillUnmount");
    },
    componentDidMount() {
        this._ll("componentDidMount");
    },
    shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        return true;
    },
    render() {
        var generations = this.props.generations;
        var grid_width = life_game.blk_width;
        var grid_height = life_game.blk_height;
        var cells_drawn = this.props.cells_drawn;
        var cells_processed = this.props.cells_processed;
        var is_paused = life_game.animation.is_paused() || life_game.animation.is_stopped();
        return (
            <div className="main">
                <p className="section-heading">[control buttons]
                </p>
                <div className="toggle-button">
                    <input id={this.state.input_id} type="checkbox" checked={is_paused} onChange={this._toggle_play_pause}/>
                    <label htmlFor={this.state.input_id} className="play-and-stop">
                        <div>
                            <a ref="svg-pause" className="pause">
                                <div>
                                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 58 58">
                                        <circle className="shaded" cx="29" cy="29" r="29"/>
                                        <rect className="empress" x="32.66" y="16" width="8" height="26"/>
                                        <rect className="empress" x="19.33" y="16" width="8" height="26"/>
                                    </svg>
                                </div>
                            </a>
                            <a ref="svg-play" className="play">
                                <div>
                                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 58 58">
                                        <circle className="shaded" cx="29" cy="29" r="29"/>
                                        <g>
                                            <polygon className="empress" points="44,29 22,44 22,29.273 22,14"/>
                                            <path className="empress" d="M22,45c-0.16,0-0.321-0.038-0.467-0.116C21.205,44.711,21,44.371,21,44V14
c0-0.371,0.205-0.711,0.533-0.884c0.328-0.174,0.724-0.15,1.031,0.058l22,15C44.836,28.36,45,28.669,45,29s-0.164,0.64-0.437,0.826
l-22,15C22.394,44.941,22.197,45,22,45z M23,15.893v26.215L42.225,29L23,15.893z"/>
                                        </g>
                                    </svg>
                                </div>
                            </a>
                        </div>
                    </label>
                    <a ref="svg-stop" className="stop" onClick={this._pause_and_clear}>
                        <div >
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 58 58">
                                <circle className="shaded" cx="29" cy="29" r="29"/>
                                <g>
                                    <rect className="empress" x="16" y="16" width="26" height="26"/>
                                    <path className="empress" d="M43,43H15V15h28V43z M17,41h24V17H17V41z"/>
                                </g>
                            </svg>
                        </div>
                    </a>
                </div>
                <ul className="table">
                    <li>
                        <span>generations:</span>
                        <span ref="generation" className="txt-nr">{generations}</span>
                    </li>
                    <li>
                        <span>grid width:</span>
                        <span ref="grid-width" className="txt-nr">{grid_width}</span>
                    </li>
                    <li>
                        <span>grid height:</span>
                        <span ref="grid-height" className="txt-nr">{grid_height}</span>
                    </li>
                    <li>
                        <span>cells processed:</span>
                        <span ref="cells-eval" className="txt-nr">{cells_processed}</span>
                    </li>
                    <li>
                        <span>cells drawn:</span>
                        <span ref="cells-drawn" className="txt-nr">{cells_drawn}</span>
                    </li>
                </ul>
            </div>
        );
    }
});

var FlapoutHeader = React.createClass({
    _ll(str) {
        //console.log(str + ":[" + this.constructor.displayName + "]");
    },

    _open(evt) {
        var signal = this.props.signal_parent;
        if (signal) {
            signal({tag: "open"});
        }
    },

    _close(evt) {
        var signal = this.props.signal_parent;
        if (signal) {
            signal({tag: "close"});
        }
    },

    getInitialState() {
        this._ll("getInitialState");
        return null;
    },

    componentWillMount() {
        this._ll("componentWillMount");
    },

    componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },

    componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },

    componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },

    componentWillUnmount() {

        this._ll("componentWillUnmount");
    },
    componentDidMount() {
        this._ll("componentDidMount");
    },

    shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        if (nextProps.fps != this.props.fps) {
            return true;
        }
        return false;
    },

    render() {
        return (
            <div className="header">
                <div ref="btn-open" className="open" onClick={this._open}>
                    <svg version="1.1" viewBox="0 0 49.656 49.656">
                        <g>
                            <polygon points="14.535,48.242 11.707,45.414 32.292,24.828 11.707,4.242 14.535,1.414 37.949,24.828 	"></polygon>
                            <path d="M14.535,49.656l-4.242-4.242l20.585-20.586L10.293,4.242L14.535,0l24.829,24.828L14.535,49.656z M13.121,45.414l1.414,1.414l22-22l-22-22l-1.414,1.414l20.585,20.586L13.121,45.414z"></path>
                        </g>
                    </svg>
                </div>
                <div className="fps">
                    <span >f.p.s.&nbsp;:</span>
                    <span key="fps" ref="fps-number">{this.props.fps}</span>
                </div>
                <div ref="btn-close" className="close" onClick={this._close}>
                    <svg version="1.1" viewBox="0 0 42 42">
                        <line className="lcl" x1="21" y1="0" x2="21" y2="42"></line>
                        <line className="lcl" x1="42" y1="21" x2="0" y2="21"></line>
                    </svg>
                </div>
            </div>
        );
    }
});

var Flapout = React.createClass({

    _ll(str) {
        console.log(str + ":[" + this.constructor.displayName + "]");
    },

    _msg_handler(msg) {
        util.ll(JSON.stringify(msg));
        var fps;
        switch (msg.tag) {
            case "generations-tick":
                this.setState({generations: msg.generation});
                break;
            case "fps":
                /* { tag:"fps",delta:this.delta,num_ticks:this.tick_count } */
                fps = (msg.delta == 0)
                    ? 0
                    : Math.round(msg.num_ticks * 1000 / msg.delta);
                this.setState({fps: fps});
                break;
            case "cell-stats":
                this.setState({c_processed: msg.cells_processed, c_drawn: msg.cells_drawn});
                break;
            case "open":
                util.add_classes(this.refs["flap-window"], "extend");
                break;
            case "close":
                util.remove_classes(this.refs["flap-window"], "extend");
                break;
            case "resized":
                this.forceUpdate();
                break;
            case "clear_and_pause":
                this.refs.flapoutFooter._clear_selection();
                break;
            default:
                throw new Error('[Flapout] received an unknown message:' + msg);
        }
        // throw new Error('[Flapout] received an unknown message:' + msg);
    },

    getInitialState() {
        this._ll("getInitialState");
        return {fps: "--", generations: 0, extend: true};
    },

    componentWillMount() {
        this._ll("componentWillMount");
    },

    componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },

    componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },

    componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },

    componentWillUnmount() {
        this._ll("componentWillUnmount");
    },
    componentDidMount() {
        this._ll("componentDidMount");
        life_game.register_signal_handler(this._msg_handler);
    },
    shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        return true;
    },
    render() {
        var fps = this.state.fps;
        if (fps < 10) {
            fps = "0" + fps;
        }
        if (life_game.animation.is_paused() || life_game.animation.is_stopped()) {
            fps = "--";
        }
        var generations = this.state.generations;
        var class_names = ["flapout"];
        if (this.state.extend == true) {
            class_names.push("extend");
        }
        var nr_processed = this.state.c_processed;
        var nr_drawn = this.state.c_drawn;

        return (
            <div ref="flap-window" className={class_names.join(' ')}>
                <FlapoutHeader ref="flapoutHeader" fps={fps} signal_parent={this._msg_handler}/> {/*<!--main-->*/}
                <FlapoutMain signal_parent={this._msg_handler} ref="flapoutMain" generations={generations} cells_processed={nr_processed} cells_drawn={nr_drawn}/>
                <FlapoutFooter ref="flapoutFooter"/>
            </div>
        );
    }
});
var Canvas = React.createClass({
    _ll(str) {
        console.log(str + ":[" + this.constructor.displayName + "]");
    },

    _msg_handler(msg) {

        throw new Error('[Canvas] received an unknown message:' + msg);
    },

    _resize_canvas() {
        var _width = this.refs.surface.offsetWidth;
        var _height = this.refs.surface.offsetHeight;

        _width = (_width - 1) - (_width - 1) % 6;
        _height = (_height - 1) - (_height - 1) % 6;

        var blk_width = (_width) / 6;
        var blk_height = (_height) / 6;

        var main_canvas = this.refs["main-canvas"];
        var magnify_canvas = this.refs["magnify"];
        main_canvas.width = _width;
        main_canvas.height = _height;

        life_game.blk_width = blk_width;
        life_game.blk_height = blk_height;
        life_game.canvas_width = _width;
        life_game.canvas_height = _height;
        life_game.init(main_canvas, magnify_canvas);

        life_game.selected_seed();
        life_game.plot_index_buffer();
        this.props.monitor_dialog._msg_handler({tag: "resized"});
    },

    _schedule_resize(evt) {

        life_game.animation.queue.unshift({type: "once", op: this._resize_canvas});
        var type = (evt && evt.type)
            ? evt.type
            : "resize is not event-triggered";
        this._ll({tag: type});
    },

    _on_mouse_over_mouse_down: function(evt) {
        var _canvas = this.refs["main-canvas"];
        var rect = _canvas.getBoundingClientRect();
        var x = Math.max(0, evt.clientX - rect.left);
        var y = Math.max(0, evt.clientY - rect.top);
        life_game.mouse_mark(x, y, (evt.buttons != 0));
    },

    getInitialState() {
        this._ll("getInitialState");
        return null;
    },

    componentWillMount() {
        this._ll("componentWillMount");
    },

    componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },
    componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },
    componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },
    componentWillUnmount() {
        window.removeEventListener("resize", this.cancel_resize_key);
        this._ll("componentWillUnmount");
        life_game.animation.stop().then(function() {
            this._ll("animation has stopped!");
        }).catch(function(reason) {
            console.log("could not stop:" + reason);
        });
    },
    componentDidMount() {
        this._ll("componentDidMount");
        //throttle global window resize event
        //this.cancel_resize_key = util.throttle("resize", "throttleResize", window);
        //window.addEventListener("throttleResize", this._schedule_resize);
        window.addEventListener("resize", this._schedule_resize);
        this.cancel_resize_key = this._schedule_resize;
        this._resize_canvas();
    },
    shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        return false;
    },
    render() {
        this._ll("render");
        return (
            <div key="surface_000" ref="surface" className="inner-canvas">
                <canvas key="canvas-333" ref="main-canvas" className="main-canvas" width="0px" height="0px" onMouseMove={this._on_mouse_over_mouse_down} onMouseDown={this._on_mouse_over_mouse_down}>Canvas!</canvas>
                <canvas key="canvas-666" ref="magnify" className="magnify" width="0px" height="0px"></canvas>
            </div>
        );
    }
});
var App = React.createClass({
    _ll(str) {
        util.ll(str + ":[" + this.constructor.displayName + "]");
    },

    _msg_handler(msg) {
        throw new Error('[App] received an unknown message:' + msg);
    },

    getInitialState() {
        this._ll("getInitialState");
        life_game.selected_seed = life_game.seed_random_20pct;
        return null;
    },

    componentWillMount() {
        this._ll("componentWillMount");
    },

    componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },

    componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },

    componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },

    componentWillUnmount() {
        this._ll("componentWillUnmount");
    },

    componentDidMount() {
        this._ll("componentDidMount");
        life_game.animation.start();

    },

    shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        return false;
    },

    render() {
        this._ll("render");
        return (<Canvas monitor_dialog={this.props.monitor_dialog}/>);
    }
});
window.onload = function() {
    var flapout = ReactDOM.render(
        <Flapout/>, document.getElementById("flapout-container"));
    var canvasApp = ReactDOM.render(
        <App monitor_dialog={flapout}/>, document.getElementById("container-anchor"));
    console.log(life_game);
}
