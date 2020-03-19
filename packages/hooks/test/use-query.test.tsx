/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';
import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import 'jest-fetch-mock';

import {
	createCache,
	createClient,
	IMicroGraphQLClient
} from '@micro-graphql/core';

import {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	MicroGraphQLProvider,
	useQuery,
	IUseQueryResult,
	IUseQueryOptions
} from '../src';

import {
	query,
	variables,
	response,
	errorResponse
} from './mock-film';

// eslint-disable-next-line max-len
type RenderFunc = (opts?: IUseQueryOptions) => RenderHookResult<IUseQueryOptions, IUseQueryResult<unknown>>;

describe('use-query', () => {
	const expected = JSON.parse(response);
	const errorExpected = JSON.parse(errorResponse);

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
			render = ({ skip, skipCache, clientOnly }: IUseQueryOptions = {}): RenderHookResult<IUseQueryOptions, IUseQueryResult<unknown>> => renderHook(
				(props = {}) => {
					const options: IUseQueryOptions | undefined = skip
						|| skipCache
						|| props.skip
						|| props.skipCache
						|| props.clientOnly ? {
							skip,
							skipCache,
							clientOnly,
							...props
						} : undefined;

					return useQuery(query, variables, options);
				},
				{
					wrapper: ({ children }) => (
						<MicroGraphQLProvider client={client}>
							{children}
						</MicroGraphQLProvider>
					)
				}
			);
		});

		it('can skip query', async () => {
			const wrapper = render({ skip: true });

			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toBeUndefined();
			expect(global.fetch.mock.calls.length).toBe(0);

			wrapper.unmount();
		});

		it('can skip ssr query', async () => {
			client = createClient({
				cache: createCache(),
				fetch: global.fetch,
				url: 'https://swapi-graphql.netlify.com/.netlify/functions/index',
				ssr: true
			});

			const wrapper = render({ skip: true, clientOnly: true });

			expect(wrapper.result.current.loading).toBe(true);
			await client.resolveQueries();
			expect(wrapper.result.current.data).toBeUndefined();
			expect(global.fetch.mock.calls.length).toBe(0);

			wrapper.unmount();
		});

		it('can still rnder ssr clientOnly', async () => {
			const wrapper = render({ clientOnly: true });
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});

		it('can handle bad response', async () => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(() => new Promise(done => {
				resolve = (): void => {
					done('Some genaric error message lol');
				};
			}));

			const wrapper = render();
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toBeUndefined();
			expect(wrapper.result.current.networkError).toBeTruthy();
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});

		it('can handle error response', async () => {
			global.fetch.resetMocks();
			global.fetch.mockResponse(() => new Promise(done => {
				resolve = (): void => {
					done(errorResponse);
				};
			}));

			const wrapper = render();
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(errorExpected.data);
			expect(wrapper.result.current.errors).toEqual(errorExpected.errors);
			expect(wrapper.result.current.networkError).toBeUndefined();
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});

		it('can make query', async () => {
			const wrapper = render();
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});

		it('can reload query from cache', async () => {
			const wrapper = render();
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.rerender();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});

		it('can reload query from network', async () => {
			const wrapper = render();
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.rerender({ skipCache: true });
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(2);

			wrapper.unmount();
		});

		it('can recieve updates from cache', async () => {
			const wrapper = render();
			expect(wrapper.result.current.loading).toBe(true);

			resolve();
			await wrapper.waitForNextUpdate();
			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(expected.data);
			expect(global.fetch.mock.calls.length).toBe(1);

			const updatedData = {
				film: {
					...expected.data.film,
					title: 'Updated Title'
				}
			};

			act(() => client.cache.writeQuery(query, variables, updatedData));

			expect(wrapper.result.current.loading).toBe(false);
			expect(wrapper.result.current.data).toEqual(updatedData);
			expect(global.fetch.mock.calls.length).toBe(1);

			wrapper.unmount();
		});
	});
});
