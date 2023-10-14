module.exports = {};
//import ReactDOM from 'react-dom';
//import React from 'react';
// queue is some kind of message queue (no it is not), it will be "polled" in each animationFrame tick
// Design should be    controller, state (and functions managing state), renderer (canvas wrapper), hourglass

//   UI ->controller -> state
//                   -> renderer (uses state) -> canvas
//                   -> render hour glass (uses state, do not "snip it" from the canvas)
//   UI <- state (show some stats in UI)
//   UI <- canvas

function repeat_anim(queue) {
	'use strict';
	queue = queue || [];
	return {
		delta: 0,
		tick_count: 0,
		time_b: 0,
		time_e: 0,
		queue,
		/*target_delta: 33,*/
		status: {
			state: undefined, // "running" | "error" | "stop" | "seed_20pct" | "seed_60pct"
			generation: 0,
			is_paused: undefined, // is it "stop" but not clearing/resetting all state to initial values
			prev_ts_stamp_delta: 0, // this is to show fps
			prev_time_st: 0 // needed to calculate "prev_ts_stamp_delta"
		},
		signal_performance_stats(msg) {
			if (this.call_back instanceof Function) {
				this.call_back(msg);
			}
		},
		start_if_stopped() {
			if (this.status.state === 'running') {
				// is this an issue?
				if (this.is_paused()) {
					this.pause_off();
				}
				return;
			}
			this.status.generation = 0;
			this.start();
		},
		reset() {
			this.status.generation = 0;
		},
		start() {
			var status = this.status; // shortcut
			var start = this.start.bind(this);
			var now;

			this.status.generation = this.status.generation || 0;
			this.signal_performance_stats({
				tag: 'generations-tick',
				generation: this.status.generation
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
						tag: 'fps',
						delta: this.delta,
						num_ticks: this.tick_count
					});
					this.tick_count = 0;
				}
			}
			requestAnimationFrame((time_stamp) => {
				this.status.prev_ts_stamp_delta = time_stamp - this.status.prev_time_st;
				this.status.prev_time_st = time_stamp;
				this.status.state = 'running';

				const work = queue.pop();

				if (work.type === 'stop') {
					this.status.state = 'stop';
					this.status.is_paused = false;
					this.status.generation = 0;
					return;
				}
				work.op(this.status);
				if (work.type == 'repeat') {
					queue.unshift(work);
				}
				start();
			});
		},
		pause_on() {
			this.status.is_paused = true;
		},
		is_paused() {
			return this.status.is_paused ? true : false;
		},
		pause_off() {
			this.status.is_paused = false;
		},
		is_stopped() {
			return this.status.state === 'stop' ? true : false;
		},
		stop() {
			queue.unshift({ type: 'stop' });
		}
	};
}

var life_game = {
	animation: null, // not sure what is this
	canvas_elt: null, //
	blk_width: 0,
	blk_height: 0,
	grid_color: 'rgb(245,247,249)',
	frame_current: null,
	frame_next: null,
	frame_work_todo_index: null,
	snail_trail: null,
	snail_trail_wm: 0,
	snail_trail_cursor: 0,
	color1: 'rgb(0,166,133)',
	color2: 'rgb(0,204,187)',
	color3: 'rgb(210,224,49)',
	selected_seed: null,
	nr_cells_processed: [0, 0, 0],

	register_signal_handler: function (func) {
		this.call_back = func;
		this.animation.call_back = func;
	},

	signal_performance_stats: function (msg) {
		if (!this.call_back) {
			return;
		}
		this.call_back(msg);
	},

	do_next_generation: function (status) {
		if (status.paused) {
			this.mouse_mark();
			return;
		}
		this.next_frame_and_swap();
		this.plot_index_buffer();
		this.mouse_mark();
		status.generation++;
	},
	// what does this do?
	get_number_snail_items: function () {
		var nr_itms = 0;

		// this happens when there was as buffer wrap around
		if (this.snail_trail_wm < this.snail_trail_cursor) {
			// we introduce zero (0) to make it more readable
			//
			nr_itms = this.snail_trail_wm - 0 + (this.get_snail_length() - this.snail_trail_cursor);
		} else {
			// "wm" nr_items to be drawn
			nr_itms = this.snail_trail_wm - this.snail_trail_cursor;
		}
		return nr_itms / 3; // always an integer because "this.snail_trail_wm" and "this.snail_trail_cursor" are multipels of 3
	},
	// the snail trail is (in the limit the same size as the grid (you visit every pixel once, ludicrous ofc))
	// but it is actually some kind of mouse event queueBuffer
	get_snail_length: function () {
		return this.snail_trail.length - (this.snail_trail.length % 3);
	},
	snail_cursor_next: function () {
		if (this.get_number_snail_items() === 0) {
			// there is no lag
			return undefined;
		}
		var sl = this.get_snail_length();
		this.snail_trail_cursor = (this.snail_trail_cursor + 3) % sl;
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
			srcctx = this.canvas_elt.getContext('2d');
			ctx = this.canvas_elt_magnify.getContext('2d');
			ctx.imageSmoothingEnabled = false;
			ctx.mozImageSmoothingEnabled = false;
			ctx.webkitImageSmoothingEnabled = false;
			ctx.msImageSmoothingEnabled = false;
			rc = this.get_color_from_frame(x, y);
			ctx.drawImage(this.canvas_elt, x - 6 * 3, y - 6 * 3, 30, 30, 0, 0, 5 * 12, 5 * 12);
			this.canvas_elt_magnify.style.left = x - 5 * 6 + 'px';
			this.canvas_elt_magnify.style.top = y - 5 * 6 + 'px';
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
		this.frame_work_todo_index = new Int32Array(grid_size); // grid_size = maximum amount of work to do?

		// these three variables make the state of the "snail_trail" work
		this.snail_trail = new Int32Array(grid_size); // still what is this?
		this.snail_trail_wm = 0;
		this.snail_trail_cursor = 0;
		//
	},
	clear_screen: function () {
		var i, j;
		if (!(this.canvas_elt instanceof HTMLElement)) {
			throw new Error('this.elt.canvas is not an HTMLElement');
		}
		var ctx = this.canvas_elt.getContext('2d');
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
		// pixel color probability distribution
		//1 2 3 4 5 6 7 8
		//1 1 2 2 2 2 3 3
		//
		// color 1 = no pixel
		if (c < 3) {
			return 3;
		}
		if (c > 6) {
			return 1;
		}
		return 2;
	},
	seed_random_20pct: function () {
		this.seed_random_percentage(0.2);
	},
	seed_random_60pct: function () {
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
		if (pct > 0.2) {
			dont_try = true;
		}
		if (pct === undefined) {
			pct = 0.2;
		}

		var count = pct * max_num;

		var arr = new Array(max_num);

		for (i = 0; i <= count; ) {
			var xcor = Math.trunc(Math.random() * this.blk_width);
			var ycor = Math.trunc(Math.random() * this.blk_height);
			var index = xcor + ycor * this.blk_width;
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
	seed_colony: function (count) {},
	seed_space_invaders: function () {},
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
		// only add cell if position is empty
		if (this.frame_current[rc.coords] === 0) {
			this.frame_work_todo_index[this.work_todo] = rc.coords;
			this.frame_current[rc.coords] = this.color_picker();
			this.work_todo++;
		}
	},

	process_ui_events() {
		const nr_items = this.get_number_snail_items(); // should be no more then 1

		// purge the lag in this micro-cycle
		while (nr_items > 0) {
			nr_items--;
			const i = this.snail_trail_cursor;
			this.snail_cursor_next();
			const x = this.snail_trail[i];
			const y = this.snail_trail[i + 1];
			const b = this.snail_trail[i + 2];
			this.restore_color(x, y);
			if (b) {
				this.add_cell(x, y);
			}
			if (nr_items === 0) {
				this.draw_magnify(x, y);
				this.plot_red_marker(x, y); // does not add the red marker to the logical grid
			}
		}
	},

	// this is plotting magnifying glass
	// do "do_next_generation" calls this function without any arguments
	// the mouse-over and mouse-down event are calling this function
	mouse_mark(x, y, btn_press) {
		let nr_items;
		let i;

		let b;

		const snail_end = this.snail_trail.length - (this.snail_trail.length % 3); // absolute length
		//
		// scenario 1: looks close to initial start
		// 0       cursor   wm     end
		// |-------|--------|------|        data between cursor and wm is not drawn
		//
		// scenario 2: cursor wrapped around but wm did not
		// 0    wm           cursor end
		// |----|------------|------|       data between cursor and end is not drawn + data between 0 and wm is not drawn

		if (Number.isInteger(x) && Number.isInteger(y)) {
			if (this.snail_trail_wm === snail_end) {
				//end of buffer, round robin
				if (this.snail_trail_cursor < 3) {
					// can we do round robin?
					return; // THIS SHOULD NEVER HAPPEN PRACTICALLY, HUMANS NOT THAT FAST IN UI
				}
				// place data in cursor
				this.snail_trail_wm = 3; // next position is here
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
		}

		nr_items = this.get_number_snail_items(); // should be no more then 1

		// purge the lag in this micro-cycle
		while (nr_items > 0) {
			nr_items--;
			i = this.snail_trail_cursor;
			this.snail_cursor_next();
			x = this.snail_trail[i];
			y = this.snail_trail[i + 1];
			b = this.snail_trail[i + 2];
			this.restore_color(x, y);
			if (b) {
				this.add_cell(x, y);
			}
			if (nr_items === 0) {
				this.draw_magnify(x, y);
				this.plot_red_marker(x, y); // does not add the red marker to the logical grid
			}
		}
	},
	//
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

	get_color_from_frame: function (screenX, screenY) {
		const xm = screenX - 1;
		const ym = screenY - 1;

		// screen coords to logical grid coordinates

		var xcor = (xm - (xm % 6)) / 6; // no rounding errors
		var ycor = (ym - (ym % 6)) / 6; // why divide by 6

		var coords = xcor + ycor * this.blk_width; // column first matrix

		var color = this.frame_current[coords]; // get color

		return {
			color: color,
			xcor: xcor,
			ycor: ycor,
			coords: coords
		};
	},

	restore_color: function (x, y) {
		var ctx = this.canvas_elt.getContext('2d');
		var rc = this.get_color_from_frame(x, y);
		if (rc.color === undefined) {
			return; // this is a sign the grid has been altered
		}
		var color = this.color_index_to_color(rc.color);

		ctx.fillStyle = color;
		ctx.fillRect(1 + rc.xcor * 6, 1 + rc.ycor * 6, 4, 4);
	},

	plot_red_marker: function (x, y) {
		var rc = this.get_color_from_frame(x, y);
		if (rc.color == undefined) {
			return; //do nothing, this is a sign the grid has been altered
		}
		var ctx = this.canvas_elt.getContext('2d');
		ctx.fillStyle = 'red';
		ctx.fillRect(1 + rc.xcor * 6, 1 + rc.ycor * 6, 4, 4);
	},

	plot_index_buffer: function () {
		var ctx = this.canvas_elt.getContext('2d');
		var coords;
		var color;
		var xcor;
		var ycor;
		// ctx.clearRect(0, 0, this.canvas_width,this.canvas_height );
		var i;
		this.canvas_elt.style.visibility = 'hidden';
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
		current_state = current_state == 255 ? 0 : current_state;
		var is_dead = current_state == 0;

		// 4.Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
		if (is_dead && nr == 3) {
			rc = this.color_picker();
			if (rc < 1) {
				throw new Error('wrong color picked');
			}
		}
		// 3.Any live cell with more than three live neighbours dies, as if by over-population.
		else if (!is_dead && nr > 3) {
			rc = 0;
		}
		// 2.Any l"ive cell with two or three live neighbours lives on to the next generation.
		else if (!is_dead && (nr == 2 || nr == 3)) {
			rc = current_state; //dont change color
		}
		// 1.Any live cell with fewer than two live neighbours dies, as if caused by under-population.
		else if (!is_dead && nr < 2) {
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

	next_frame_and_swap() {
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
			this.signal_performance_stats({
				tag: 'cell-stats',
				cells_processed: 0,
				cells_drawn: 0
			});
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
		this.signal_performance_stats({ tag: 'cell-stats', cells_drawn: j, cells_processed: i });

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
				if (cells[j] > nr_cells - 1) {
					throw new Error('Index out of bounds');
				}
				color = this.frame_current[cells[j]];
				if (color == 0) {
					this.frame_current[cells[j]] = 255; /*I NEED A NON ZERO MARKER */
					this.frame_work_todo_index[this.work_todo] = cells[j];
					this.work_todo++;
				}
				if (this.work_todo > nr_cells) {
					throw new Error('index grows larger then buffer');
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
			return a - b;
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
				if (coords) {
					//non null
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

var rep = repeat_anim([
	{
		type: 'repeat',
		op: life_game.do_next_generation.bind(life_game), // calculate next step in time
		tag: 'next-frame'
	}
]);

life_game.animation = rep;

var util = {
	add_classes(elt, ...classnames) {
		var i;
		if (typeof elt == 'string') {
			elt = document.getElementById(elt);
		}
		for (i = 0; i < classnames.length; i++) {
			elt.classList.add(classnames[i]);
		}
		return elt;
	},

	remove_classes(elt, ...classnames) {
		var i;
		if (typeof elt === 'string') {
			elt = document.getElementById(elt);
		}
		for (i = 0; i < classnames.length; i++) {
			elt.classList.remove(classnames[i]);
		}
		return elt;
	},

	ll(str) {
		console.log('%c' + 'str', 'color: green');
	},

	generateUUID() {
		'use strict';
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
		});
		return uuid;
	}
};

var FlapoutFooter = React.createClass({
	_ll(str) {
		util.ll(str + ':[' + this.constructor.displayName + ']');
	},
	_msg_handler(msg) {
		throw new Error('[App] received an unknown message:' + msg);
	},
	_select_radio(evt) {
		var r_value = evt.target.value;
		this.setState({ radio_selection: r_value });
		life_game.animation.pause_on();
		life_game.clear();
		switch (r_value) {
			case 'seed_60pct':
				life_game.selected_seed = life_game.seed_random_60pct;
				break;
			case 'seed_20pct':
				life_game.selected_seed = life_game.seed_random_20pct;
				break;
			default:
				life_game.selected_seed = life_game.seed_random_20pct;
		}
		life_game.selected_seed();
		life_game.plot_index_buffer();
		/*life_game.animation.start_if_stopped();*/
	},
	_clear_selection: function () {
		this.setState({ radio_selection: '' });
	},
	getInitialState() {
		this._ll('getInitialState');
		return { radio_01: util.generateUUID(), radio_02: util.generateUUID() };
	},

	componentWillMount() {
		this._ll('componentWillMount');
	},

	componentWillReceiveProps(nextProps) {
		this._ll('componentWillReceiveProps');
	},

	componentWillUpdate(nextProps, nextState) {
		this._ll('componentWillUpdate');
	},

	componentDidUpdate(prevProps, prevState) {
		this._ll('componentDidUpdate');
	},

	componentWillUnmount() {
		this._ll('componentWillUnmount');
	},

	componentDidMount() {
		this._ll('componentDidMount');
	},

	shouldComponentUpdate(nextProps, nextState) {
		this._ll('shouldComponentUpdate');
		return true;
	},

	render() {
		var is_seed_20pct = this.state.radio_selection == 'seed_20pct' ? true : false;
		var is_seed_60pct = this.state.radio_selection == 'seed_60pct' ? true : false;

		return (
			<div className="footer">
				<p className="section-heading">[select seeding]</p>
				<ul className="table select-radio">
					<li>
						<span>
							<input
								type="radio"
								id={this.state.radio_01}
								value="seed_20pct"
								checked={is_seed_20pct}
								name="selector"
								onChange={this._select_radio}
							/>
							<label htmlFor={this.state.radio_01}>
								<span className="radio-text">Random seeding 20%</span>
								<div className="check">
									<div>
										<div></div>
									</div>
								</div>
							</label>
						</span>
					</li>
					<li>
						<span>
							<input
								type="radio"
								id={this.state.radio_02}
								value="seed_60pct"
								name="selector"
								checked={is_seed_60pct}
								onChange={this._select_radio}
							/>
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
		util.ll(str + ':[' + this.constructor.displayName + ']');
	},

	_toggle_play_pause(evt) {
		var rc = life_game.animation.is_paused() || life_game.animation.is_stopped();
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
		this.props.signal_parent({ tag: 'clear_and_pause' });
		return;
	},
	_msg_handler(msg) {
		throw new Error('[App] received an unknown message:' + msg);
	},
	getInitialState() {
		this._ll('getInitialState');
		return { input_id: util.generateUUID(), is_paused: false };
	},
	componentWillMount() {
		this._ll('componentWillMount');
	},
	componentWillReceiveProps(nextProps) {
		this._ll('componentWillReceiveProps');
	},
	componentWillUpdate(nextProps, nextState) {
		this._ll('componentWillUpdate');
	},
	componentDidUpdate(prevProps, prevState) {
		this._ll('componentDidUpdate');
	},
	componentWillUnmount() {
		this._ll('componentWillUnmount');
	},
	componentDidMount() {
		this._ll('componentDidMount');
	},
	shouldComponentUpdate(nextProps, nextState) {
		this._ll('shouldComponentUpdate');
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
				<p className="section-heading">[control buttons]</p>
				<div className="toggle-button">
					<input
						id={this.state.input_id}
						type="checkbox"
						checked={is_paused}
						onChange={this._toggle_play_pause}
					/>
					<label htmlFor={this.state.input_id} className="play-and-stop">
						<div>
							<a ref="svg-pause" className="pause">
								<div>
									<svg
										version="1.1"
										xmlns="http://www.w3.org/2000/svg"
										xmlnsXlink="http://www.w3.org/1999/xlink"
										viewBox="0 0 58 58"
									>
										<circle className="shaded" cx="29" cy="29" r="29" />
										<rect
											className="empress"
											x="32.66"
											y="16"
											width="8"
											height="26"
										/>
										<rect
											className="empress"
											x="19.33"
											y="16"
											width="8"
											height="26"
										/>
									</svg>
								</div>
							</a>
							<a ref="svg-play" className="play">
								<div>
									<svg
										version="1.1"
										xmlns="http://www.w3.org/2000/svg"
										xmlnsXlink="http://www.w3.org/1999/xlink"
										viewBox="0 0 58 58"
									>
										<circle className="shaded" cx="29" cy="29" r="29" />
										<g>
											<polygon
												className="empress"
												points="44,29 22,44 22,29.273 22,14"
											/>
											<path
												className="empress"
												d="M22,45c-0.16,0-0.321-0.038-0.467-0.116C21.205,44.711,21,44.371,21,44V14
c0-0.371,0.205-0.711,0.533-0.884c0.328-0.174,0.724-0.15,1.031,0.058l22,15C44.836,28.36,45,28.669,45,29s-0.164,0.64-0.437,0.826
l-22,15C22.394,44.941,22.197,45,22,45z M23,15.893v26.215L42.225,29L23,15.893z"
											/>
										</g>
									</svg>
								</div>
							</a>
						</div>
					</label>
					<a ref="svg-stop" className="stop" onClick={this._pause_and_clear}>
						<div>
							<svg
								version="1.1"
								xmlns="http://www.w3.org/2000/svg"
								xmlnsXlink="http://www.w3.org/1999/xlink"
								viewBox="0 0 58 58"
							>
								<circle className="shaded" cx="29" cy="29" r="29" />
								<g>
									<rect
										className="empress"
										x="16"
										y="16"
										width="26"
										height="26"
									/>
									<path
										className="empress"
										d="M43,43H15V15h28V43z M17,41h24V17H17V41z"
									/>
								</g>
							</svg>
						</div>
					</a>
				</div>
				<ul className="table">
					<li>
						<span>generations:</span>
						<span ref="generation" className="txt-nr">
							{generations}
						</span>
					</li>
					<li>
						<span>grid width:</span>
						<span ref="grid-width" className="txt-nr">
							{grid_width}
						</span>
					</li>
					<li>
						<span>grid height:</span>
						<span ref="grid-height" className="txt-nr">
							{grid_height}
						</span>
					</li>
					<li>
						<span>cells processed:</span>
						<span ref="cells-eval" className="txt-nr">
							{cells_processed}
						</span>
					</li>
					<li>
						<span>cells drawn:</span>
						<span ref="cells-drawn" className="txt-nr">
							{cells_drawn}
						</span>
					</li>
				</ul>
			</div>
		);
	}
});

var FlapoutHeader = React.createClass({
	_ll(str) {
		console.log(str + ':[' + this.constructor.displayName + ']');
	},

	_open(evt) {
		var signal = this.props.signal_parent;
		if (signal) {
			signal({ tag: 'open' });
		}
	},

	_close(evt) {
		var signal = this.props.signal_parent;
		if (signal) {
			signal({ tag: 'close' });
		}
	},

	getInitialState() {
		this._ll('getInitialState');
		return null;
	},

	componentWillMount() {
		this._ll('componentWillMount');
	},

	componentWillReceiveProps(nextProps) {
		this._ll('componentWillReceiveProps');
	},

	componentWillUpdate(nextProps, nextState) {
		this._ll('componentWillUpdate');
	},

	componentDidUpdate(prevProps, prevState) {
		this._ll('componentDidUpdate');
	},

	componentWillUnmount() {
		this._ll('componentWillUnmount');
	},
	componentDidMount() {
		this._ll('componentDidMount');
	},

	shouldComponentUpdate(nextProps, nextState) {
		this._ll('shouldComponentUpdate');
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
					<span>f.p.s.&nbsp;:</span>
					<span key="fps" ref="fps-number">
						{this.props.fps}
					</span>
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
		console.log(str + ':[' + this.constructor.displayName + ']');
	},

	// commands from the UI
	_msg_handler(msg) {
		util.ll(JSON.stringify(msg));
		var fps;
		switch (msg.tag) {
			case 'generations-tick':
				this.setState({ generations: msg.generation });
				break;
			case 'fps':
				/* { tag:"fps",delta:this.delta,num_ticks:this.tick_count } */
				fps = msg.delta == 0 ? 0 : Math.round((msg.num_ticks * 1000) / msg.delta);
				this.setState({ fps: fps });
				break;
			case 'cell-stats':
				this.setState({ c_processed: msg.cells_processed, c_drawn: msg.cells_drawn });
				break;
			case 'open':
				util.add_classes(this.refs['flap-window'], 'extend');
				break;
			case 'close':
				util.remove_classes(this.refs['flap-window'], 'extend');
				break;
			case 'resized':
				this.forceUpdate();
				break;
			case 'clear_and_pause':
				this.refs.flapoutFooter._clear_selection();
				break;
			default:
				throw new Error('[Flapout] received an unknown message:' + msg);
		}
		// throw new Error('[Flapout] received an unknown message:' + msg);
	},

	getInitialState() {
		this._ll('getInitialState');
		return { fps: '--', generations: 0, extend: true };
	},

	componentWillMount() {
		this._ll('componentWillMount');
	},

	componentWillReceiveProps(nextProps) {
		this._ll('componentWillReceiveProps');
	},

	componentWillUpdate(nextProps, nextState) {
		this._ll('componentWillUpdate');
	},

	componentDidUpdate(prevProps, prevState) {
		this._ll('componentDidUpdate');
	},

	componentWillUnmount() {
		this._ll('componentWillUnmount');
	},
	componentDidMount() {
		this._ll('componentDidMount');
		life_game.register_signal_handler(this._msg_handler);
	},
	shouldComponentUpdate(nextProps, nextState) {
		this._ll('shouldComponentUpdate');
		return true;
	},
	render() {
		var fps = this.state.fps;
		if (fps < 10) {
			fps = '0' + fps;
		}
		if (life_game.animation.is_paused() || life_game.animation.is_stopped()) {
			fps = '--';
		}
		var generations = this.state.generations;
		var class_names = ['flapout'];
		if (this.state.extend == true) {
			class_names.push('extend');
		}
		var nr_processed = this.state.c_processed;
		var nr_drawn = this.state.c_drawn;

		return (
			<div ref="flap-window" className={class_names.join(' ')}>
				<FlapoutHeader ref="flapoutHeader" fps={fps} signal_parent={this._msg_handler} />{' '}
				{/*<!--main-->*/}
				<FlapoutMain
					signal_parent={this._msg_handler}
					ref="flapoutMain"
					generations={generations}
					cells_processed={nr_processed}
					cells_drawn={nr_drawn}
				/>
				<FlapoutFooter ref="flapoutFooter" />
			</div>
		);
	}
});

var Canvas = React.createClass({
	_ll(str) {
		console.log(str + ':[' + this.constructor.displayName + ']');
	},

	_resize_canvas() {
		var _width = this.refs.surface.offsetWidth;
		var _height = this.refs.surface.offsetHeight;

		_width = _width - 1 - ((_width - 1) % 6);
		_height = _height - 1 - ((_height - 1) % 6);

		var blk_width = _width / 6;
		var blk_height = _height / 6;

		var main_canvas = this.refs['main-canvas'];
		var magnify_canvas = this.refs['magnify'];
		main_canvas.width = _width;
		main_canvas.height = _height;

		life_game.blk_width = blk_width;
		life_game.blk_height = blk_height;
		life_game.canvas_width = _width;
		life_game.canvas_height = _height;
		life_game.init(main_canvas, magnify_canvas);

		life_game.selected_seed();
		life_game.plot_index_buffer();
		this.props.monitor_dialog._msg_handler({ tag: 'resized' });
	},

	_schedule_resize(evt) {
		life_game.animation.queue.unshift({ type: 'once', op: this._resize_canvas });
		var type = evt && evt.type ? evt.type : 'resize is not event-triggered';
		this._ll({ tag: type });
	},

	_on_mouse_over_mouse_down: function (evt) {
		var _canvas = this.refs['main-canvas'];
		var rect = _canvas.getBoundingClientRect();
		var x = Math.max(0, evt.clientX - rect.left); // clamp it in x
		var y = Math.max(0, evt.clientY - rect.top); // clamp it in y
		// post this mouse event (mouse over to show magnify glass tracking)
		// optionally if button pressed place a dot on the grid
		life_game.mouse_mark(x, y, evt.type === 'mousedown');
	},

	getInitialState() {
		this._ll('getInitialState');
		return null; // there is no initial state
	},

	/*componentWillMount() {
        this._ll("componentWillMount");
    },*/

	/*componentWillReceiveProps(nextProps) {
        this._ll("componentWillReceiveProps");
    },*/

	/*componentWillUpdate(nextProps, nextState) {
        this._ll("componentWillUpdate");
    },
    */

	/*componentDidUpdate(prevProps, prevState) {
        this._ll("componentDidUpdate");
    },*/

	componentWillUnmount() {
		window.removeEventListener('resize', this._schedule_resize);
		this._ll('componentWillUnmount');
		life_game.animation.stop();
	},

	componentDidMount() {
		this._ll('componentDidMount');
		window.addEventListener('resize', this._schedule_resize);
		this._resize_canvas();
	},

	/*shouldComponentUpdate(nextProps, nextState) {
        this._ll("shouldComponentUpdate");
        return false;
    },*/

	render() {
		this._ll('render');
		return (
			<div key="surface_000" ref="surface" className="inner-canvas">
				<canvas
					key="canvas-333"
					ref="main-canvas"
					className="main-canvas"
					width="0px"
					height="0px"
					onMouseMove={this._on_mouse_over_mouse_down}
					onMouseDown={this._on_mouse_over_mouse_down}
				>
					Canvas!
				</canvas>

				<canvas
					key="canvas-666"
					ref="magnify"
					className="magnify"
					width="0px"
					height="0px"
				></canvas>
			</div>
		);
	}
});

var App = React.createClass({
	_ll(str) {
		util.ll(str + ':[' + this.constructor.displayName + ']');
	},

	getInitialState() {
		this._ll('getInitialState');
		life_game.selected_seed = life_game.seed_random_20pct;
		return null;
	},

	componentWillMount() {
		this._ll('componentWillMount');
	},

	componentWillReceiveProps(nextProps) {
		this._ll('componentWillReceiveProps');
	},

	componentWillUpdate(nextProps, nextState) {
		this._ll('componentWillUpdate');
	},

	componentDidUpdate(prevProps, prevState) {
		this._ll('componentDidUpdate');
	},

	componentWillUnmount() {
		this._ll('componentWillUnmount');
	},

	componentDidMount() {
		this._ll('componentDidMount');
		life_game.animation.start();
	},

	shouldComponentUpdate(nextProps, nextState) {
		this._ll('shouldComponentUpdate');
		return false;
	},

	render() {
		this._ll('render');
		return <Canvas monitor_dialog={this.props.monitor_dialog} />;
	}
});

window.onload = function () {
	const flapout = ReactDOM.render(<Flapout />, document.getElementById('flapout-container'));

	ReactDOM.render(<App monitor_dialog={flapout} />, document.getElementById('container-anchor'));
};
