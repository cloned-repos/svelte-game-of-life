import type { LoggerController } from '@mangos/debug-frontend';

export default function createBackEndMock() {
	return (prefix = ''): LoggerController => ({
		send(namespace: string, formatter: string, ...args: any[]) {
			console.info(namespace + ', ' + formatter, ...args);
		},
		isEnabled(_namespace: string) {
			return true;
		}
	});
}
