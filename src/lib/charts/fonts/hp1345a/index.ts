// source: https://phk.freebsd.dk/hacks/Wargames/
// all glyphs
import _1 from './glyphs/01';
import _2 from './glyphs/02';
import transform from './helpers';

export default function createGlyps() {
    return {
        // hp glyph
        1: transform(_1),
        // beta
        2: transform(_2),
    };
}
