/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';
import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import 'jest-fetch-mock';
import gql from 'graphql-tag';
import * as merge from 'deepmerge';

import {
	createCache,
	createClient,
	IMicroGraphQLClient
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	MicroGraphQLProvider,
	useClientQuery,
	UseClientQueryResult
} from '../src';

const query = gql`
	query UseClientTest {
		home {
			selectedEpisode
		}
	}
`;

interface IHomeClientQuery {
	home: {
		__typename: 'Home';
		selectedEpisode: string;
	};
}

const initialData: IHomeClientQuery = {
	home: {
		__typename: 'Home',
		selectedEpisode: 'ZmlsbXM6MQ=='
	}
};

// eslint-disable-next-line max-len
type RenderFunc = (d?: IHomeClientQuery | undefined) => RenderHookResult<unknown, UseClientQueryResult<IHomeClientQuery | undefined>>;

describe('use-client-query', () => {
	describe('client', () => {
		let client: IMicroGraphQLClient;
		let render: RenderFunc;
		beforeEach(() => {
			global.fetch.resetMocks();
			global.fetch.mockResponse('Some genaric error message');

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
			});

			// eslint-disable-next-line max-len
			render = (d: IHomeClientQuery | undefined): RenderHookResult<unknown, UseClientQueryResult<IHomeClientQuery | undefined>> => renderHook(
				() => useClientQuery(query, undefined, d),
				{
					wrapper: ({ children }) => (
						<MicroGraphQLProvider client={client}>
							{children}
						</MicroGraphQLProvider>
					)
				}
			);
		});

		it('does not set initial data for undefined', async () => {
			const wrapper = render(undefined);

			expect(wrapper.result.current[0]).toEqual(undefined);

			wrapper.unmount();
		});

		it('get initial data', async () => {
			const wrapper = render(initialData);

			expect(wrapper.result.current[0]).toEqual(initialData);

			wrapper.unmount();
		});

		it('receives updated data from cache', async () => {
			const wrapper = render(initialData);

			expect(wrapper.result.current[0]).toEqual(initialData);

			const newData: IHomeClientQuery = merge(
				initialData,
				{
					home: {
						selectedEpisode: 'rofl'
					}
				}
			);

			act(() => wrapper.result.current[1](newData));

			expect(wrapper.result.current[0]).toEqual(newData);

			wrapper.unmount();
		});
	});
});
