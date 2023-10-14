import { describe, it } from 'vitest';

import { collisionBlock, collisionLines, far, near, hard, soft } from '../hv-lines-block';

describe('logical-graphic-state', () => {
	describe('margins notation: [range]/[margin]', () => {
		it('block1: x ∈ [5, 9]/[3,3]  y ∈ [2,10]/[5,5], block2: x ∈ [8, 14]/[5,2], y ∈ [12, 13]/[3,3]', ({
			expect
		}) => {
			const answ = collisionBlock(
				// 1st
				5,
				9,
				2,
				10,
				3,
				3,
				5,
				5,
				// 2nd
				8,
				14,
				12,
				13,
				5,
				2,
				3,
				3
			);
			expect(answ).toBe(soft);
		});
		it('block1: x ∈ [5, 9]/[3,3]  y ∈ [2,10]/[5,5], block2: x ∈ [12, 14]/[5,2], y ∈ [12, 13]/[3,3]', ({
			expect
		}) => {
			const answ = collisionBlock(
				// 1st
				5,
				9,
				2,
				10,
				3,
				3,
				5,
				5,
				// 2nd
				12,
				14,
				12,
				13,
				5,
				2,
				3,
				3
			);
			expect(answ).toBe(soft);
		});
		it('block1: x ∈ [5, 9]/[3,3]  y ∈ [2,10]/[5,5], block2: x ∈ [12, 14]/[5,2], y ∈ [9, 12]/[5,5]', ({
			expect
		}) => {
			const answ = collisionBlock(
				// 1st
				5,
				9,
				2,
				10,
				3,
				3,
				5,
				5,
				// 2nd
				12,
				14,
				9,
				12,
				5,
				2,
				5,
				5
			);
			expect(answ).toBe(soft);
		});
		it('block1: x ∈ [5, 9]/[3,3]  y ∈ [2,10]/[5,5], block2: x ∈ [12, 14]/[2,2], y ∈ [9, 12]/[5,5]', ({
			expect
		}) => {
			const answ = collisionBlock(
				// 1st
				5,
				9,
				2,
				10,
				3,
				3,
				5,
				5,
				// 2nd
				12,
				14,
				9,
				12,
				2,
				2,
				5,
				5
			);
			expect(answ).toBe(near);
		});
	});
	describe('no margins', () => {
		it('block1: x ∈ [5, 9], y ∈ [2,10], block2: x ∈ [6, 10], y ∈ [9, 12]', ({ expect }) => {
			const answ = collisionBlock(5, 9, 2, 10, 0, 0, 0, 0, 6, 10, 9, 12, 0, 0, 0, 0);
			expect(answ).toBe(hard);
		});
		it('block1: x ∈ [5, 9], y ∈ [2,10], block2: x ∈ [6, 10], y ∈ [12, 14]', ({ expect }) => {
			const answ = collisionBlock(5, 9, 2, 10, 0, 0, 0, 0, 6, 10, 12, 14, 0, 0, 0, 0);
			expect(answ).toBe(far);
		});
		it('2 points (4,6) and (2,3)', ({ expect }) => {
			const answ = collisionLines(4, NaN, 6, NaN, 0, 0, 0, 0, 2, NaN, 3, NaN, 0, 0, 0, 0);
			expect(answ).toBe(far);
			const answ2 = collisionLines(4, NaN, 6, NaN, 0, 0, 0, 0, 4, NaN, 6, NaN, 0, 0, 0, 0);
			expect(answ2).toBe(hard);
		});
		it('line (4,2) -> (4,6), piont (2,3)', ({ expect }) => {
			const answ = collisionLines(
				4,
				NaN,
				2,
				6,
				0,
				0,
				0,
				0,
				//
				2,
				NaN,
				3,
				NaN,
				0,
				0,
				0,
				0
			);
			expect(answ).toBe(far);
		});
		it('line (4,2) -> (4,6), piont (4,3)', ({ expect }) => {
			const answ = collisionLines(
				4,
				NaN,
				2,
				6,
				0,
				0,
				0,
				0,
				//
				4,
				NaN,
				3,
				NaN,
				0,
				0,
				0,
				0
			);
			expect(answ).toBe(hard);
		});
		it('non crossed Hline (-2,4)->(10, 4), vLine (-2,-3)->(-2,3)', ({ expect }) => {
			const answ = collisionLines(
				-2,
				10,
				4,
				NaN,
				0,
				0,
				0,
				0,
				//
				-2,
				NaN,
				-3,
				3,
				0,
				0,
				0,
				0
			);
			expect(answ).toBe(far);
		});
		it('crossed Hline (-2,4)->(10, 4), vLine (0,-3)->(0,6)', ({ expect }) => {
			const answ = collisionLines(
				-2,
				10,
				4,
				NaN,
				0,
				0,
				0,
				0,
				//
				0,
				NaN,
				-3,
				6,
				0,
				0,
				0,
				0
			);
			expect(answ).toBe(hard);
		});
		it('non-crossed Hline (-2,4)->(10, 4), HLine (11, 4)->(12, 4)', ({ expect }) => {
			const answ = collisionLines(
				-2,
				10,
				4,
				NaN,
				0,
				0,
				0,
				0,
				//
				11,
				12,
				4,
				NaN,
				0,
				0,
				0,
				0
			);
			expect(answ).toBe(far);
		});
	});
});
