// ◯
// https://phk.freebsd.dk/hacks/Wargames/_wargames_11.svg
const raw = `
m(-2,5)
# polyline xmlns="http://www.w3.org/2000/svg" points=" -2,-5 -5,-2 -5,2 -2,5 2,5 5,2 5,-2 2,-5 -2,-5"/>
l(-5,-2)
l(-5,2)
l(-2,5)
l(2,5)
l(5,2)
l(5,-2)
l(2,-5)
l(-2,-5) # this one not really needed when doing "closePath()"
e(0,0)
`;
export default raw;