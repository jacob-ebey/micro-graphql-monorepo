import { DocumentNode } from 'graphql/language/ast';
import { print } from 'graphql/language/printer';
import { GraphQLFormattedError } from 'graphql/error/formatError';

import { IMicroGraphQLCache } from './cache';
import { objectHash } from './hash';

export interface IMicroGraphQLResult<TData> {
	data?: TData;
	errors?: GraphQLFormattedError[];
}

export interface IMicroGraphQLQueryOptions {
	skipCache?: boolean;
}

export interface IMicroGraphQLClient {
	cache: IMicroGraphQLCache;
	resolveQueries(): Promise<void>;
	query<TData, TVariables>(
		query: DocumentNode,
		variables?: TVariables,
		options?: IMicroGraphQLQueryOptions
	): Promise<IMicroGraphQLResult<TData>>;
	mutate<TData, TVariables>(
		mutation: DocumentNode,
		variables?: TVariables
	): Promise<IMicroGraphQLResult<TData>>;
}

export interface IMicroGraphQLClientConfig {
	cache: IMicroGraphQLCache;
	fetch(input: RequestInfo, init?: RequestInit | undefined): Promise<Response>;
	ssr?: boolean;
	url: string;
}

export function createClient({
	cache,
	fetch,
	ssr,
	url
}: IMicroGraphQLClientConfig): IMicroGraphQLClient {
	const requests: { [key: string]: Promise<unknown> } = {};

	async function doRequest<TData, TVariables>(
		query: DocumentNode,
		variables?: TVariables
	): Promise<IMicroGraphQLResult<TData>> {
		const resultPromise = (async (): Promise<IMicroGraphQLResult<TData>> => {
			const response = await fetch(url, {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: print(query),
					variables
				})
			});

			const json = (await response.json()) as IMicroGraphQLResult<TData>;

			if (json.data) {
				cache.writeQuery<TData, TVariables>(query, variables, json.data);
			}

			return json;
		})();

		if (ssr) {
			requests[objectHash({ query, variables })] = resultPromise;
		}

		const result = await resultPromise;

		return result;
	}

	return {
		cache,

		async resolveQueries(): Promise<void> {
			await Promise.all(Object.getOwnPropertyNames(requests).map(key => requests[key]));
		},

		async query<TData, TVariables>(
			query: DocumentNode,
			variables?: TVariables,
			options: IMicroGraphQLQueryOptions = {
				skipCache: false
			}
		): Promise<IMicroGraphQLResult<TData>> {
			const { skipCache } = options;

			const preparedQuery = cache.prepareQuery(query);

			if (!skipCache) {
				const data = cache.readQuery<TData, TVariables>(preparedQuery, variables);

				if (typeof data !== 'undefined') {
					return {
						data
					};
				}
			}

			const result = await doRequest<TData, TVariables>(query, variables);

			return result;
		},

		async mutate<TData, TVariables>(
			mutation: DocumentNode,
			variables: TVariables
		): Promise<IMicroGraphQLResult<TData>> {
			const preparedMutation = cache.prepareQuery(mutation);

			const result = await doRequest<TData, TVariables>(preparedMutation, variables);

			return result;
		}
	};
}
