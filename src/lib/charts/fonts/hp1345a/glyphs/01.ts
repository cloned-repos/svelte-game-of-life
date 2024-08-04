// https://phk.freebsd.dk/hacks/Wargames/
// https://phk.freebsd.dk/hacks/Wargames/_wargames_01.svg
const raw = `
    m(19,0)
    l(3,0)
    l(0,3)
    l(0,24)
    l(3,27)
    l(14,27)
    #
    m(20,27)
    l(42,27)
    l(45,24)
    l(45,3)
    l(42,0)
    l(25,0)
    # letter 'h'
    m(13,9)
    l(17,27)
    m(15,18)
    l(19,18)
    l(21,16)
    l(20,9)
    # letter 'p', 
    m(22,0)
    l(26,18)
    l(30,18)
    l(32,16)
    l(31,11)
    l(29,9)
    l(24,9)
    # move to end to start next letter
    e(54,0)
`;

export default raw;


