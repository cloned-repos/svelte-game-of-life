import type { Axis } from './types';
export function getDefaultAxis(): Axis {
	return {
		label: {
			fontSize: {
				min: 10,
				max: 14,
				collapseVisibility: true
			}
		},
		tickSize: {
			// if the yaxis font "descent" would overlap the x-axis label with this value then:
			// 1. x-labels are not drawn
			// or
			// 2. y-labels are not drawn
			max: 6,
			collapseVisibility: true
		}
	};
}
// learn to parse font shorthand to get the font family options
/*
[ 
	[ <‘font-style’> || <font-variant-css21> || <‘font-weight’> || <‘font-stretch’> ]? 
	<‘font-size’> [ / <‘line-height’> ]?
	<‘font-family’> 
] | caption | icon | menu | message-box | small-caption | status-bar

<‘font-style’> = 	normal | italic | oblique
<font-variant-css21> = [normal | small-caps]
<‘font-weight’> =normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
<‘font-stretch’> =	normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded
<‘font-size’> =	<absolute-size> | <relative-size> | <length-percentage>
<absolute-size> =[ xx-small | x-small | small | medium | large | x-large | xx-large ]
 <relative-size>=[ larger | smaller ]
<length-percentage>= [ <length> | <percentage> ], where the <percentage> will resolve to a <length>.
*/
export function getFontInformation(fontShorthand: string) {
	const div = document.createElement('div');
	div.style.font = fontShorthand;
	div.style.display = 'none';
	document.appendChild(div);
	const cs = getComputedStyle(div);
	const fontFamily = cs.fontFamily;
	const fontSize = cs.fontSize;
	const fontStyle = cs.fontStyle;
	document.removeChild(div);
	return {
		fontFamily,
		fontSize,
		fontStyle
	};
}
