/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	ITinyGraphQLClient,
	ITinyGraphQLResult,
	queryKeyError,
	objectHash
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	TinyGraphQLProvider,
	useQuery,
	useClient,
	TinyGraphQLContext,
	noClientError,
	IUseQueryResult,
	ITinyGraphQLContextValue
} from '../src';

describe('use-query', () => {
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
	let client: ITinyGraphQLClient;
	let wrapper: (provided?: ITinyGraphQLClient) => React.FC;

	beforeEach(() => {
		global.fetch.resetMocks();
		global.fetch.mockResponse(`
			{"data":{"film":{"title":"A New Hope"}}}
		`);

		options = {
			fetch: global.fetch,
			hash: objectHash,
			url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
			cache: createCache()
		};
		client = createClient(options);
		wrapper = (provided?: ITinyGraphQLClient) => ({
			children
		}: React.PropsWithChildren<{}>): React.ReactElement => (
			<TinyGraphQLProvider client={provided || client}>{children}</TinyGraphQLProvider>
		);
	});

	it('can skip query', async () => {
		const { result } = renderHook(
			() => useQuery<IQueryResult, unknown>({
				query,
				variables,
				skip: true
			}),
			{ wrapper: wrapper() }
		);

		expect(result.current.loading).toBe(false);
	});

	it('can make ssr query', async () => {
		const ssrClient = createClient({ ...options, ssr: true });
		const { result } = renderHook(
			() => useQuery<IQueryResult, unknown>(React.useMemo(() => ({
				query,
				variables
			}), [])),
			{ wrapper: wrapper(ssrClient) }
		);

		expect(result.current.loading).toBe(true);

		await ssrClient.resolveQueries();
		const { result: result2 } = renderHook(
			() => useQuery<IQueryResult, unknown>(React.useMemo(() => ({
				query,
				variables
			}), [])),
			{ wrapper: wrapper(ssrClient) }
		);

		expect(result2.current.loading).toBe(false);
		validateResult(result2.current);
	});

	it('can make query', async () => {
		const { result, waitForNextUpdate } = renderHook(
			() => useQuery<IQueryResult, unknown>(React.useMemo(() => ({
				query,
				variables
			}), [])),
			{ wrapper: wrapper() }
		);

		expect(result.current.loading).toBe(true);

		await waitForNextUpdate();

		expect(result.current.loading).toBe(false);
		validateResult(result.current);
	});

	it('can make subsequent srr batched queries', async () => {
		const ssrClient = createClient({ ...options, ssr: true });
		const { result } = renderHook<unknown, IUseQueryResult<IQueryResult>[]>(
			() => [
				useQuery<IQueryResult, unknown>(React.useMemo(() => ({
					query,
					variables
				}), [])),
				useQuery<IQueryResult, unknown>(React.useMemo(() => ({
					query,
					variables
				}), []))
			],
			{ wrapper: wrapper(ssrClient) }
		);

		expect(result.current[0].loading).toBe(true);
		expect(result.current[1].loading).toBe(true);

		await ssrClient.resolveQueries();

		const { result: result2 } = renderHook<unknown, IUseQueryResult<IQueryResult>[]>(
			() => [
				useQuery<IQueryResult, unknown>(React.useMemo(() => ({
					query,
					variables
				}), [])),
				useQuery<IQueryResult, unknown>(React.useMemo(() => ({
					query,
					variables
				}), []))
			],
			{ wrapper: wrapper(ssrClient) }
		);

		expect(result2.current[0].loading).toBe(false);
		validateResult(result2.current[0]);
		expect(result2.current[1].loading).toBe(false);
		validateResult(result2.current[1]);
		expect(result2.current[1].data).toBe(result2.current[0].data);
	});

	it('can make subsequent batched queries', async () => {
		const { result, waitForNextUpdate } = renderHook<unknown, IUseQueryResult<IQueryResult>[]>(
			() => [
				useQuery<IQueryResult, unknown>(React.useMemo(() => ({
					query,
					variables
				}), [])),
				useQuery<IQueryResult, unknown>(React.useMemo(() => ({
					query,
					variables
				}), []))
			],
			{ wrapper: wrapper() }
		);

		expect(result.current[0].loading).toBe(true);
		expect(result.current[1].loading).toBe(true);

		await waitForNextUpdate();

		expect(result.current[0].loading).toBe(false);
		validateResult(result.current[0]);
		expect(result.current[1].loading).toBe(false);
		validateResult(result.current[1]);
		expect(result.current[1].data).toBe(result.current[0].data);
	});

	it('throws when hash fails', async () => {
		try {
			const { result, waitForNextUpdate } = renderHook(
				() => useQuery<IQueryResult, unknown>({
					query,
					variables
				}),
				{
					wrapper: wrapper(
						createClient({
							...options,
							hash: () => null
						})
					)
				}
			);

			expect(result.current.loading).toBe(true);

			await waitForNextUpdate();
			expect(true).toBe(false);
		} catch (err) {
			expect(err.message).toBe(queryKeyError);
			return;
		}
		expect(true).toBe(false);
	});
});
