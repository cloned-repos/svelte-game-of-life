export type Block = {
	xmin: number;
	xmax: number;
	ymin: number;
	ymax: number;
	xminM: number;
	xmaxM: number;
	yminM: number;
	ymaxM: number;
};

export type HLine = {
	xmin: number;
	xmax: number;
	xminM: number;
	xmaxM: number;
	yTop: number;
	yBottom: number;
};

export type VLine = {
	ymin: number;
	ymax: number;
	yminM: number;
	ymaxM: number;
	xRight: number;
	xLeft: number;
};

export type CollisionState = 'near' | 'far' | 'collision-hard' | 'collision-soft';
