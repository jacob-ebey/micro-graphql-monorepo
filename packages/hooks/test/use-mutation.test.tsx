/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLClient,
	IMicroGraphQLConfig,
	IMicroGraphQLResult,
	objectHash
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	MicroGraphQLProvider,
	UseMutationResult,
	useMutation
} from '../src';

describe('use-mutation', () => {
	const mutation = `
		query TestMutation($id: ID) {
			film: deleteFilm(filmID: $id) {
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

	it('can do mutation', async () => {
		const {
			result,
			waitForNextUpdate
		} = renderHook<unknown, UseMutationResult<IQueryResult, unknown>>(
			() => useMutation<IQueryResult, unknown>(React.useMemo(() => ({
				query: mutation,
				variables
			}), [])),
			{ wrapper: wrapper() }
		);

		expect(result.current[0].loading).toBe(false);

		act(() => {
			result.current[1]();
		});

		await waitForNextUpdate();

		validateResult(result.current[0]);
	});
});
