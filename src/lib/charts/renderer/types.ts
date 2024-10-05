type Point = {
	arg: [number, number];
};

type Rectangle = {
	arg: [number, number, number, number];
};

type SingleNumber = {
	arg: number;
};

type NumberArray = {
	arg: number[];
};

type StringArg = {
	arg: string;
};

type MoveTo = {
	type: 'mt';
};

type MoveToProcessor = MoveTo &
	Point & {
		type: 'mt';
		fn(ctx: CanvasRenderingContext2D, data: Point): void;
	};

type LineTo = {
	type: 'lt';
};

type LineToProcessor = LineTo &
	Point & {
		fn(ctx: CanvasRenderingContext2D, data: Point): void;
	};

type Stroke = {
	type: 'st';
};

type StrokeProcessor = Stroke & {
	fn(ctx: CanvasRenderingContext2D): void;
};

type Fill = {
	type: 'fi';
};

type FillProcessor = Fill & {
	fn(ctx: CanvasRenderingContext2D): void;
};

type LineWidth = SingleNumber & {
	type: 'lw';
};

type LineWidthProcessor = LineWidth & {
	fn(ctx: CanvasRenderingContext2D, width: number): void;
};

type LineDash = NumberArray & {
	type: 'ld';
};

type LineDashProcessor = LineDash & {
	fn(ctx: CanvasRenderingContext2D, dashes: number[]): void;
};

type FillStyle = StringArg & {
	type: 'fs';
};

type FillStyleProcessor = FillStyle & {
	fn(ctx: CanvasRenderingContext2D, style: string): void;
};

type StrokeStyle = StringArg & {
	type: 'ss';
};

type StrokeStyleProcessor = StrokeStyle & {
	fn(ctx: CanvasRenderingContext2D, style: string): void;
};

type Save = {
	type: 'sa';
};

type SaveProcessor = Save & {
	fn(ctx: CanvasRenderingContext2D): void;
};

type Restore = {
	type: 'res';
};

type RestorProcessor = Restore & {
	fn(ctx: CanvasRenderingContext2D): void;
};

type Rect = Rectangle & {
	type: 'rect';
};

type RectProcessor = Rect & {
	fn(ctx: CanvasRenderingContext2D, rectange: Rectangle): void;
};

export type GraphicPrimitives =
	| MoveToProcessor
	| LineToProcessor
	| StrokeProcessor
	| FillProcessor
	| LineWidthProcessor
	| LineDashProcessor
	| FillStyleProcessor
	| StrokeStyleProcessor
	| SaveProcessor
	| RestorProcessor
	| RectProcessor;

type ProcessorsMap = {
    [Primitive in GraphicPrimitives as Primitive['type']]: Primitive['fn']; 
}

type AllProcessorsType = keyof AllProcessorsMap;

type ProcessorOfTypeMap<T extends AllProcessorsType> = AllProcessorsMap[T];

// optional type
type ProcessorArgument<T> = T extends { arg: infer P } ? [P] : never[];

export function processDraw
type ActionType = keyof CalculatorActionsMap;

    export type AllInstructions = 