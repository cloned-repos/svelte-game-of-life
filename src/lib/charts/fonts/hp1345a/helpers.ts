
import type { FontMetrics } from '../types';
import { regExp4Parsing } from './constants';
import type { Instruction } from './types';

function trimComments(line: string): string {
    const pos = line.indexOf('#');
    if (pos >= 0){
        return line.slice(0, pos);
    }
    return line;
}

function trim(line: string): string {
   return line.trim();
}

function parseInstruction(line: string): {} | Instruction {
    const matched = line.match(regExp4Parsing);
    if (matched === null || !matched.groups) {
        return {};
    }
    const { groups: { instr: t, x, y} } = matched;
    return { t, x: parseFloat(x), y:parseFloat(y) };
}

export function isInstruction(u: any): u is Instruction {
    return typeof u?.t === 'string' && typeof u?.x === 'number' && typeof u?.y === 'number';
}

export default function transform(raw: string): ({} | Instruction)[] {
    const lines = raw.split('\n').map(trimComments).map(trim).filter(Boolean);
    const instructions = lines.map(parseInstruction);
    return instructions;
}

export function getFontMetrics(glyps: Record<number, Instruction[]>): FontMetrics {
    // to do
    return null;
}

