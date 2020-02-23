/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';
import { renderHook, RenderHookResult, act } from '@testing-library/react-hooks';
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLClient
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	MicroGraphQLProvider,
	useMutation,
	UseMutationResult
} from '../src';

import { query, variables, response } from './mock-film';

// eslint-disable-next-line max-len
type RenderFunc = () => RenderHookResult<unknown, UseMutationResult<unknown>>;

describe('use-mutation', () => {
	const expected = JSON.parse(response);

	describe('client', () => {
		let client: IMicroGraphQLClient;
		let render: RenderFunc;
		let resolve: () => void;
		beforeEach(() => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(() => new Promise(done => {
				resolve = (): void => {
					done(response);
				};
			}));

			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index'
			});

			// eslint-disable-next-line max-len
			render = (): RenderHookResult<unknown, UseMutationResult<unknown>> => renderHook(
				() => useMutation(query, variables),
				{
					wrapper: ({ children }) => (
						<MicroGraphQLProvider client={client}>
							{children}
						</MicroGraphQLProvider>
					)
				}
			);
		});

		it('can do mutation', async () => {
			const wrapper = render();
			expect(wrapper.result.current[0].loading).toBe(false);

			act(() => wrapper.result.current[1]());

			expect(wrapper.result.current[0].loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current[0].loading).toBe(false);
			expect(wrapper.result.current[0].data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});
	});
});
