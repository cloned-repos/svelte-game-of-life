// source: https://phk.freebsd.dk/hacks/Wargames/
// all glyphs
import _1 from './glyphs/01';
import _2 from './glyphs/02';
import _4 from './glyphs/04';
import _5 from './glyphs/05';
import _6 from './glyphs/06';
import _7 from './glyphs/07';
import _14 from './glyphs/0e';
import _15 from './glyphs/0f';

import t from './helpers';

export default function createGlyps() {
    return {
        // hp glyph
        1: t(_1),
        // beta
        2: t(_2),
        4: t(_4),
        5: t(_5),
        6: t(_6),
        7: t(_7),
        14: t(_14),
        15: t(_15),

    };
}
