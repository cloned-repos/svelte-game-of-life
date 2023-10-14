import type { CollisionState } from '../types';
import { far, near, soft, hard } from '../constants';

function collisionAxisRange(
	max1: number,
	marginMax1: number,
	min2: number,
	marginMin2: number
): CollisionState {
	const max1Most = max1 + marginMax1;
	const min2Most = min2 - marginMin2;

	// increasing X, left -> right
	// b1 |----|>>>
	// b2           <|----|
	if (max1 >= min2) {
		return hard;
	}
	if (max1Most < min2Most) {
		return far;
	}
	if (max1Most >= min2 && min2Most <= max1) {
		return soft;
	}
	return near;
}

function someFar(a: CollisionState, b: CollisionState) {
	return a === far || b === far;
}

//function someHard(a: CollisionState, b: CollisionState) {
//	return a === hard || b === hard;
//}

function someSoft(a: CollisionState, b: CollisionState) {
	return a === soft || b === soft;
}

function someNear(a: CollisionState, b: CollisionState) {
	return a === near || b === near;
}

export function collisionBlock(
	// 1st point
	// actual
	x1min: number,
	x1max: number,
	y1min: number,
	y1max: number,
	// margins
	x1minM: number,
	x1maxM: number,
	y1minM: number,
	y1maxM: number,
	// 2nd point
	// actual
	x2min: number,
	x2max: number,
	y2min: number,
	y2max: number,
	// margins
	x2minM: number,
	x2maxM: number,
	y2minM: number,
	y2maxM: number
): CollisionState {
	const cx12 = collisionAxisRange(x1max, x1maxM, x2min, x2minM);
	const cx21 = collisionAxisRange(x2max, x2maxM, x1min, x1minM);
	const cy12 = collisionAxisRange(y1max, y1maxM, y2min, y2minM);
	const cy21 = collisionAxisRange(y2max, y2maxM, y1min, y1minM);
	// b1 |----|>>>
	// b2           <|----|
	// b2 |----|>>>
	// b1           <|----|
	if (someFar(cx12, cx21) || someFar(cy12, cy21)) {
		return far;
	}
	if (someNear(cx12, cx21) || someNear(cy12, cy21)) {
		return near;
	}
	if (someSoft(cx12, cx21)) {
		if (someSoft(cy12, cy21)) {
			return soft;
		}
		return soft;
	}
	// b1 |----|>>>
	// b2    <|----|
	// b2 		 |----|>>>
	// b1           <|----|
	// the only thing left is "hard collision"

	if (someSoft(cy12, cy21)) {
		return soft;
	}
	return hard;
}

export function collisionLines(
	x1min: number,
	x1max: number,
	y1min: number,
	y1max: number,
	x1minM: number,
	x1maxM: number,
	y1minM: number,
	y1maxM: number,
	//
	x2min: number,
	x2max: number,
	y2min: number,
	y2max: number,
	x2minM: number,
	x2maxM: number,
	y2minM: number,
	y2maxM: number
): CollisionState {
	// defaults
	let _x1min = x1min;
	let _x1max = x1max;
	let _y1min = y1min;
	let _y1max = y1max;

	// 1 is vertical line
	if (x1max === x1min || isNaN(x1max)) {
		_x1min = x1min - x1minM;
		_x1max = x1min + x1maxM;
	}
	// 1 is horizontal line
	if (y1max === y1min || isNaN(y1max)) {
		_y1min = y1min - y1minM;
		_y1max = y1min + y1maxM;
	}

	//
	// defaults
	let _x2min = x2min;
	let _x2max = x2max;
	let _y2min = y2min;
	let _y2max = y2max;

	// 2 is vertical line
	if (x2max === x2min || isNaN(x2max)) {
		_x2min = x2min - x2minM;
		_x2max = x2min + x2maxM;
	}
	// 2 is horizontal line
	if (y2max === y2min || isNaN(y2max)) {
		_y2min = y2min - y2minM;
		_y2max = y2min + y2maxM;
	}

	return collisionBlock(
		_x1min,
		_x1max,
		_y1min,
		_y2max,
		0,
		0,
		0,
		0,
		_x2min,
		_x2max,
		_y2min,
		_y2max,
		0,
		0,
		0,
		0
	);
}
