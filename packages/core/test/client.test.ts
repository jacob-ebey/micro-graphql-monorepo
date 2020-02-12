/* eslint-disable import/extensions */
/* eslint-disable import/no-extraneous-dependencies */
import * as fetch from 'isomorphic-fetch';

import {
	createCache,
	createClient,
	ITinyGraphQLResult,
	objectHash,
	queryKeyError,
	ITinyGraphQLCacheResult
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

	const validateResult = (result?: ITinyGraphQLResult<IQueryResult>): void => {
		expect(result).toBeTruthy();
		expect(result!.data).toBeTruthy();
		expect(result!.data!.film).toBeTruthy();
		expect(result!.data!.film.title).toBe('A New Hope');
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let options: any;
	beforeEach(() => {
		options = {
			fetch,
			hash: objectHash,
			url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
			cache: createCache()
		};
	});

	it('throws if fails to hash query', async () => {
		const client = createClient({
			...options,
			hash: () => null
		});

		try {
			await client.query<IQueryResult, unknown>(query, { variables });
			expect(false).toBe(true);
		} catch (err) {
			expect(err.message).toEqual(queryKeyError);
		}
	});

	it('can return cached result', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const cached: any = {};

		const client = createClient({
			...options,
			cache: {
				tryGet: <TValue>(): ITinyGraphQLCacheResult<TValue> => ({
					success: true,
					data: cached
				}),
				trySet: (): boolean => false,
				restore: jest.fn(),
				stringify: jest.fn()
			}
		});

		const result = await client.query<IQueryResult, unknown>(query, {
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
				tryGet: <TValue>(): ITinyGraphQLCacheResult<TValue> => ({
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
		client.subscribe<IQueryResult, unknown>({
			query,
			variables
		}, (res) => {
			result = res;
		});
		expect(result).toBeTruthy();
		expect(result.data).toBe(cached);
	});

	it('can make query', async () => {
		const client = createClient(options);

		const result = await client.query<IQueryResult, unknown>(query, {
			variables
		});
		validateResult(result);
	});

	it('can make ssr query', async () => {
		const client = createClient({ ...options, ssr: true });

		const result = client.query<IQueryResult, unknown>(query, {
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

		const result = await client.query<IQueryResult, unknown>(query, {
			variables
		});
		validateResult(result);

		const secondResult = await client.query<IQueryResult, unknown>(query, {
			variables
		});
		expect(secondResult.data).toBe(result.data);
	});

	it('can skip cache', async () => {
		const client = createClient({
			...options,
			cache: createCache()
		});

		const result = await client.query<IQueryResult, unknown>(query, {
			variables
		});
		validateResult(result);

		const secondResult = await client.query<IQueryResult, unknown>(query, {
			skipCache: true,
			variables
		});
		expect(secondResult.data).not.toBe(result.data);
		expect(secondResult.data).toEqual(result.data);
	});

	it('throws if fails to hash query on subscription', async () => {
		const client = createClient({
			...options,
			hash: () => null
		});

		try {
			client.subscribe({ query, variables }, () => {
				expect(false).toBe(true);
			});
			expect(false).toBe(true);
		} catch (err) {
			expect(err.message).toEqual(queryKeyError);
		}
	});

	it('can receive subscription value', async () => {
		const client = createClient({
			...options,
			cache: createCache()
		});

		let subscriptionCount = 0;
		let dataFromSubscription: ITinyGraphQLResult<IQueryResult>;
		const unsubscribe = client.subscribe<IQueryResult, unknown>(
			{ query, variables },
			data => {
				dataFromSubscription = data;
				subscriptionCount += 1;
			}
		);

		const result = await client.query<IQueryResult, unknown>(query, {
			variables
		});
		validateResult(result);
		validateResult(dataFromSubscription!);

		unsubscribe();

		const secondResult = await client.query<IQueryResult, unknown>(query, {
			skipCache: true,
			variables
		});
		expect(secondResult.data).not.toBe(result.data);
		expect(secondResult.data).toEqual(result.data);

		expect(subscriptionCount).toBe(2);
	});
});
