export interface Enqueue<T> {
	enqueue(msg: T): void;
}
