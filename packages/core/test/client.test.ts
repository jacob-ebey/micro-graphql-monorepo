/* eslint-disable import/no-extraneous-dependencies */
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLResult,
	IMicroGraphQLCacheResult,
	IMicroGraphQLConfig
} from '../src';

describe('client', () => {
	const query = `
    query TestQuery($id: ID) {
      film(filmID: $id) {
        title
      }
    }
  `;

	const variables = { id: 1 };

	interface IQueryResult {
		film: {
			title: string;
		};
	}

	const validateResult = (result?: IMicroGraphQLResult<IQueryResult>): void => {
		expect(result).toBeTruthy();
		expect(result!.data).toBeTruthy();
		expect(result!.data!.film).toBeTruthy();
		expect(result!.data!.film.title).toBe('A New Hope');
	};

	let options: IMicroGraphQLConfig;
	beforeEach(() => {
		global.fetch.resetMocks();
		global.fetch.mockResponse(`
			{"data":{"film":{"title":"A New Hope"}}}
		`);

		options = {
			fetch: global.fetch,
			url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
			cache: createCache()
		};
	});

	it('can return cached result', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cached: any = {};

		const client = createClient({
			...options,
			cache: {
				tryGet: <TValue>(): IMicroGraphQLCacheResult<TValue> => ({
					success: true,
					data: cached
				}),
				trySet: (): boolean => false,
				restore: jest.fn(),
				stringify: jest.fn()
			}
		});

		const result = await client.query<IQueryResult, {}>(query, {
			variables
		});
		expect(result).toBeTruthy();
		expect(result.data).toBe(cached);
	});

	it('can get cached result when subscribing', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cached: any = {};

		const client = createClient({
			...options,
			cache: {
				tryGet: <TValue>(): IMicroGraphQLCacheResult<TValue> => ({
					success: true,
					data: cached
				}),
				trySet: (): boolean => false,
				restore: jest.fn(),
				stringify: jest.fn()
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let result: any;
		client.subscribe<IQueryResult, {}>({
			query,
			variables
		}, (res) => {
			result = res;
		});
		expect(result).toBeTruthy();
		expect(result.data).toBe(cached);
	});

	it('skips cache if no data', async () => {
		global.fetch.resetMocks();
		global.fetch.mockResponse(`
			{}
		`);
		const client = createClient(options);

		const result = await client.query<IQueryResult, {}>(query, {
			variables
		});
		expect(result.data).toBeUndefined();
		expect(client.cache!.tryGet(query, variables).success).toBe(false);
	});

	it('can make query', async () => {
		const client = createClient(options);

		const result = await client.query<IQueryResult, {}>(query, {
			variables
		});
		validateResult(result);
	});

	it('can make ssr query', async () => {
		const client = createClient({ ...options, ssr: true });

		const result = client.query<IQueryResult, {}>(query, {
			variables
		});

		await client.resolveQueries();

		validateResult(await result);
	});

	it('can set provided cache', async () => {
		const client = createClient({
			...options,
			cache: createCache()
		});

		const result = await client.query<IQueryResult, {}>(query, {
			variables
		});
		validateResult(result);

		const secondResult = await client.query<IQueryResult, {}>(query, {
			variables
		});
		expect(secondResult.data).toBe(result.data);
	});

	it('can skip cache', async () => {
		const client = createClient({
			...options,
			cache: createCache()
		});

		const result = await client.query<IQueryResult, {}>(query, {
			variables
		});
		validateResult(result);

		const secondResult = await client.query<IQueryResult, {}>(query, {
			skipCache: true,
			variables
		});
		expect(secondResult.data).not.toBe(result.data);
		expect(secondResult.data).toEqual(result.data);
	});

	it('can receive subscription value', async () => {
		const client = createClient({
			...options,
			cache: createCache()
		});

		let subscriptionCount = 0;
		let dataFromSubscription: IMicroGraphQLResult<IQueryResult>;
		const unsubscribe = client.subscribe<IQueryResult, {}>(
			{ query, variables },
			data => {
				dataFromSubscription = data;
				subscriptionCount += 1;
			}
		);

		const result = await client.query<IQueryResult, {}>(query, {
			variables
		});
		validateResult(result);
		validateResult(dataFromSubscription!);

		unsubscribe();

		const secondResult = await client.query<IQueryResult, {}>(query, {
			skipCache: true,
			variables
		});
		expect(secondResult.data).not.toBe(result.data);
		expect(secondResult.data).toEqual(result.data);

		expect(subscriptionCount).toBe(2);
	});
});
