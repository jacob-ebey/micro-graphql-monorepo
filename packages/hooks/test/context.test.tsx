
/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLClient,
	queryKeyError,
	objectHash
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	MicroGraphQLProvider,
	useQuery,
	useClient,
	MicroGraphQLContext,
	noClientError,
	IUseQueryResult,
	IMicroGraphQLContextValue
} from '../src';

describe('context', () => {
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let options: any;
	let client: IMicroGraphQLClient;
	let wrapper: (provided?: IMicroGraphQLClient) => React.FC;

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
		wrapper = (provided?: IMicroGraphQLClient) => ({
			children
		}: React.PropsWithChildren<{}>): React.ReactElement => (
			<MicroGraphQLProvider client={provided || client}>{children}</MicroGraphQLProvider>
		);
	});

	it('context throws errors for defaults', async () => {
		const { result } = renderHook(
			() => React.useContext<IMicroGraphQLContextValue>(MicroGraphQLContext)
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => result.current.requestQuery({} as any)).toThrow(noClientError);
		expect(() => result.current.client.hash({})).toThrow(noClientError);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(() => result.current.client.subscribe({} as any, () => {
			expect(true).toBe(false);
		})).toThrow(noClientError);

		let message: string | null = null;
		try {
			await result.current.client.query('');
		} catch (err) {
			message = err.message;
		}
		expect(message).toBe(noClientError);

		try {
			await result.current.client.resolveQueries();
		} catch (err) {
			message = err.message;
		}
		expect(message).toBe(noClientError);
	});

	it('can use client', () => {
		const { result } = renderHook(() => useClient(), { wrapper: wrapper() });

		expect(result.current).toBe(client);
	});

	it('throws for no key', () => {
		renderHook(() => {
			expect(() => {
				const { requestQuery } = React.useContext(MicroGraphQLContext);
				requestQuery({
					query,
					variables
				});
			}).toThrow(queryKeyError);
		},
		{
			wrapper: wrapper(
				createClient({
					...options,
					hash: () => null
				})
			)
		});
	});
});
