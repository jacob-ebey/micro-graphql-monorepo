/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLClient
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	MicroGraphQLProvider,
	useClient,
	MicroGraphQLContext,
	noClientError
} from '../src';

import { query, variables, response } from './mock-film';

describe('context', () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let options: any;
	let client: IMicroGraphQLClient;
	let wrapper: (provided?: IMicroGraphQLClient) => React.FC;

	beforeEach(() => {
		global.fetch.resetMocks();
		global.fetch.mockResponse(response);

		options = {
			fetch: global.fetch,
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
			() => React.useContext<IMicroGraphQLClient>(MicroGraphQLContext)
		);

		expect(() => result.current.cache.prepareQuery(query)).toThrow(noClientError);
		expect(() => result.current.cache.restore('')).toThrow(noClientError);
		expect(() => result.current.cache.stringify()).toThrow(noClientError);
		expect(() => result.current.cache.writeQuery(query, variables, {})).toThrow(noClientError);
		expect(() => result.current.cache.readQuery(query, variables)).toThrow(noClientError);

		expect(() => result.current.cache.subscribe('' as any, {}, () => {
			expect(true).toBe(false);
		})).toThrow(noClientError);

		let message: string | null = null;
		try {
			await result.current.query(query, variables);
		} catch (err) {
			message = err.message;
		}
		expect(message).toBe(noClientError);

		try {
			await result.current.mutate(query, variables);
		} catch (err) {
			message = err.message;
		}
		expect(message).toBe(noClientError);

		try {
			await result.current.resolveQueries();
		} catch (err) {
			message = err.message;
		}
		expect(message).toBe(noClientError);
	});

	it('can use client', () => {
		const { result } = renderHook(() => useClient(), { wrapper: wrapper() });

		expect(result.current).toBe(client);
	});
});
