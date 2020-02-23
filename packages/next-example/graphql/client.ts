import fetch from 'isomorphic-fetch';

import {
	createCache,
	createClient,
	IMicroGraphQLClient
} from '@micro-graphql/core';

export function newClient(): IMicroGraphQLClient {
	const client = createClient({
		ssr: typeof window === 'undefined',
		fetch,
		cache: createCache(),
		url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const microInitialData = typeof (global as any).document !== 'undefined'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		? (global as any).document.body.getAttribute('data-micro-ssr')
		: undefined;

	if (microInitialData) {
		client.cache.restore(microInitialData);
	}

	return client;
}
