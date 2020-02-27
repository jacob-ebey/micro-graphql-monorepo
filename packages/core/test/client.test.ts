// eslint-disable-next-line import/no-extraneous-dependencies
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLClient,
	IMicroGraphQLResult
} from '../src';

import { query, variables, response } from './mock-film';

describe('client', () => {
	it('skips cache if no data', async () => {
		global.fetch.resetMocks();
		global.fetch.mockResponse('{}');

		const client = createClient({
			cache: createCache(),
			fetch: global.fetch,
			url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
		});

		await client.query(query, variables);

		const data = client.cache.readQuery(query, variables);
		expect(data).toBeUndefined();
	});

	describe('query', () => {
		const expected = JSON.parse(response);

		let client: IMicroGraphQLClient;
		let promise: Promise<IMicroGraphQLResult<unknown>>;
		beforeEach(() => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(response);

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
			});

			promise = client.query(query, variables);
		});

		it('can query', async () => {
			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
		});

		it('can use global request config', async () => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(response);

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
				request: {
					headers: {
						Authorization: 'Bearer 1234'
					}
				}
			});

			promise = client.query(query, variables);

			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((global.fetch.mock.calls[0][1]!.headers as any).Authorization).toBe('Bearer 1234');
		});

		it('can use request config from query', async () => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(response);

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
			});

			promise = client.query(query, variables, {
				request: {
					headers: {
						Authorization: 'Bearer 1234'
					}
				}
			});

			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((global.fetch.mock.calls[0][1]!.headers as any).Authorization).toBe('Bearer 1234');
		});

		it('can merge request configs for query', async () => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(response);

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
				request: {
					headers: {
						Authorization: 'Bearer 1234'
					}
				}
			});

			promise = client.query(query, variables, {
				request: {
					headers: {
						Extra: 'something'
					}
				}
			});

			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const headers = global.fetch.mock.calls[0][1]!.headers as any;
			expect(headers.Authorization).toBe('Bearer 1234');
			expect(headers.Extra).toBe('something');
		});

		it('can use cache', async () => {
			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);

			const secondResult = await client.query(query, variables);
			expect(secondResult).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
		});

		it('can skip cache', async () => {
			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);

			const secondResult = await client.query(query, variables, { skipCache: true });
			expect(secondResult).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(2);
		});

		it('stores in cache', async () => {
			await promise;
			const data = client.cache.readQuery(query, variables);
			expect(data).toEqual(expected.data);
		});
	});

	describe('query ssr', () => {
		const expected = JSON.parse(response);

		let client: IMicroGraphQLClient;
		beforeEach(() => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(response);

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
				ssr: true
			});

			client.query(query, variables);
		});

		it('can resolve queries', async () => {
			await client.resolveQueries();

			const result = await client.query(query, variables);
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
		});
	});

	describe('mutate', () => {
		const expected = JSON.parse(response);

		let client: IMicroGraphQLClient;
		let promise: Promise<IMicroGraphQLResult<unknown>>;
		beforeEach(() => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(response);

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
			});

			promise = client.mutate(query, variables);
		});

		it('can mutate', async () => {
			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);
		});

		it('can mutate multiple times', async () => {
			const result = await promise;
			expect(result).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(1);

			const secondResult = await client.mutate(query, variables);
			expect(secondResult).toEqual(expected);
			expect(global.fetch.mock.calls.length).toBe(2);
		});

		it('stores in cache', async () => {
			await promise;
			const data = client.cache.readQuery(query, variables);
			expect(data).toEqual(expected.data);
		});
	});
});
