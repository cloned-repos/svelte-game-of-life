import { json } from '@sveltejs/kit';

export function GET({
	cookies,
	fetch,
	getClientAddress,
	request,
	route,
	url,
	setHeaders,
	isDataRequest,
	isSubRequest
}) {
	/*
	console.log('cookies', cookies);
	console.log('request.headers', request.headers);
	console.log('route', route);
	console.log('url', url);
	*/
	const number = Math.floor(Math.random() * 6) + 1;

	return json(number);
}
