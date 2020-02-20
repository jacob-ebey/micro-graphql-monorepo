/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';

import {
	IMicroGraphQLClient,
	IMicroGraphQLResult,
	IMicroGraphQLSubscriptionOptions
} from '@micro-graphql/core';

import {
	objectHash
} from '@micro-graphql/core/lib/hash';

export const noClientError = 'no client provided, make sure a MicroGraphQLProvider is somewhere up the tree';

export class MicroGraphQLHooksNoClientProvidedError extends Error {}

export interface IUseQueryResult<TData> extends IMicroGraphQLResult<TData> {
	loading: boolean;
}

export interface IMicroGraphQLContextValue {
	client: IMicroGraphQLClient;
	requestQuery: <TQueryVariables extends { [key: string]: any }>(
		options: IMicroGraphQLSubscriptionOptions<TQueryVariables>
	) => void;
}

export const MicroGraphQLContext = React.createContext<IMicroGraphQLContextValue>({
	client: {
		async query<TData>(): Promise<IMicroGraphQLResult<TData>> {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		subscribe(): () => void {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		},
		async resolveQueries(): Promise<void> {
			throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
		}
	},
	requestQuery(): () => void {
		throw new MicroGraphQLHooksNoClientProvidedError(noClientError);
	}
});

export interface IMicroGraphQLProviderProps {
	client: IMicroGraphQLClient;
}
export const MicroGraphQLProvider: React.FC<IMicroGraphQLProviderProps> = ({
	client,
	children
}) => {
	const queriesRef = React.useRef<{
		[key: string]: boolean;
	}>({});

	const value: IMicroGraphQLContextValue = React.useMemo(() => ({
		client,
		requestQuery<TQueryVariables extends { [key: string]: any }>(
			options: IMicroGraphQLSubscriptionOptions<TQueryVariables>
		): void {
			const query = client.cache && client.cache.prepareQuery
				? client.cache.prepareQuery(options.query)
				: options.query;

			const key = objectHash({
				query,
				variables: options.variables
			});

			let shouldLoad = true;
			if (!Object.prototype.hasOwnProperty.call(queriesRef.current, key)) {
				queriesRef.current[key] = true;
			} else {
				shouldLoad = !queriesRef.current[key];
			}

			if (shouldLoad) {
				queriesRef.current[key] = true;

				const { query: q, ...queryOptions } = options;
				client.query(q, queryOptions).then().catch().then(() => {
					queriesRef.current[key] = false;
				});
			}
		}
	}), [client]);

	return (
		<MicroGraphQLContext.Provider value={value}>
			{children}
		</MicroGraphQLContext.Provider>
	);
};

export function useClient(): IMicroGraphQLClient {
	const { client } = React.useContext(MicroGraphQLContext);

	return client;
}
